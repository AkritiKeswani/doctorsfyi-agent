export interface TranscriptionResult {
  text: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

export interface SpeechToTextOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  sampleRate?: number
}

export class AssemblyAISpeechService {
  private socket: WebSocket | null = null
  private isListening = false
  private onResult: ((result: TranscriptionResult) => void) | null = null
  private onError: ((error: string) => void) | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private readonly apiKey = "4b9b73c534e14812ae546333d34de9ad"
  private readonly sampleRate: number
  private sessionId: string | null = null
  private recognition: any = null // Web Speech API fallback
  private useWebSpeechFallback = false

  constructor(options: SpeechToTextOptions = {}) {
    this.sampleRate = options.sampleRate ?? 16000
  }

  private async getTemporaryToken(): Promise<string> {
    try {
      const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expires_in: 3600,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.token
    } catch (error) {
      console.warn("AssemblyAI token generation failed, falling back to Web Speech API:", error)
      throw error
    }
  }

  private setupWebSpeechAPI(): void {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      throw new Error("Speech recognition not supported")
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = "en-US"

    this.recognition.onstart = () => {
      console.log("Web Speech API started")
    }

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (this.onResult) {
          this.onResult({
            text: result[0].transcript,
            confidence: result[0].confidence || 0.8,
            isFinal: result.isFinal,
            timestamp: Date.now(),
          })
        }
      }
    }

    this.recognition.onerror = (event: any) => {
      console.error("Web Speech API error:", event.error)
      if (this.onError) {
        this.onError(`Speech recognition error: ${event.error}`)
      }
    }

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if we're still supposed to be listening
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            this.recognition.start()
          }
        }, 100)
      }
    }
  }

  private async setupWebSocket(): Promise<void> {
    try {
      const token = await this.getTemporaryToken()

      this.socket = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${this.sampleRate}&token=${token}&format_turns=true`,
      )

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error("WebSocket not initialized"))
          return
        }

        const timeout = setTimeout(() => {
          reject(new Error("WebSocket connection timeout"))
        }, 5000)

        this.socket.onopen = () => {
          clearTimeout(timeout)
          console.log("AssemblyAI WebSocket connected")
          resolve()
        }

        this.socket.onmessage = (event) => {
          const data = JSON.parse(event.data)

          if (data.message_type === "SessionBegins") {
            this.sessionId = data.session_id
            console.log("AssemblyAI session started:", this.sessionId)
          }

          if (data.message_type === "FinalTranscript" || data.message_type === "PartialTranscript") {
            if (this.onResult && data.text) {
              this.onResult({
                text: data.text,
                confidence: data.confidence || 0.9,
                isFinal: data.message_type === "FinalTranscript",
                timestamp: Date.now(),
              })
            }
          }

          if (data.message_type === "Turn" && data.transcript) {
            if (this.onResult) {
              this.onResult({
                text: data.transcript,
                confidence: data.confidence || 0.9,
                isFinal: true,
                timestamp: Date.now(),
              })
            }
          }

          if (data.message_type === "SessionTerminated") {
            console.log("AssemblyAI session terminated")
            this.sessionId = null
          }
        }

        this.socket.onerror = (error) => {
          clearTimeout(timeout)
          console.error("AssemblyAI WebSocket error:", error)
          reject(error)
        }

        this.socket.onclose = () => {
          console.log("AssemblyAI WebSocket closed")
          if (this.isListening && !this.useWebSpeechFallback) {
            setTimeout(() => this.reconnect(), 1000)
          }
        }
      })
    } catch (error) {
      console.error("Failed to setup WebSocket:", error)
      throw error
    }
  }

  private async reconnect(): Promise<void> {
    if (this.isListening && !this.useWebSpeechFallback) {
      console.log("Attempting to reconnect to AssemblyAI...")
      try {
        await this.setupWebSocket()
        await this.setupAudioCapture()
      } catch (error) {
        console.warn("Reconnection failed, switching to Web Speech API")
        this.useWebSpeechFallback = true
        this.setupWebSpeechAPI()
        this.recognition.start()
      }
    }
  }

  private async setupAudioCapture(): Promise<void> {
    if (this.useWebSpeechFallback) {
      return // Web Speech API handles audio capture internally
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      this.audioContext = new AudioContext({ sampleRate: this.sampleRate })
      const source = this.audioContext.createMediaStreamSource(stream)

      const processor = this.audioContext.createScriptProcessor(4096, 1, 1)

      processor.onaudioprocess = (event) => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer.getChannelData(0)

          const int16Buffer = new Int16Array(inputBuffer.length)
          for (let i = 0; i < inputBuffer.length; i++) {
            int16Buffer[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768))
          }

          this.socket.send(int16Buffer.buffer)
        }
      }

      source.connect(processor)
      processor.connect(this.audioContext.destination)
    } catch (error) {
      console.error("Failed to setup audio capture:", error)
      throw error
    }
  }

  async start(onResult: (result: TranscriptionResult) => void, onError?: (error: string) => void): Promise<boolean> {
    if (this.isListening) {
      return true
    }

    this.onResult = onResult
    this.onError = onError

    try {
      try {
        await this.setupWebSocket()
        await this.setupAudioCapture()
        console.log("Using AssemblyAI for transcription")
      } catch (error) {
        console.warn("AssemblyAI failed, using Web Speech API fallback:", error)
        this.useWebSpeechFallback = true
        this.setupWebSpeechAPI()
        this.recognition.start()
      }

      this.isListening = true
      return true
    } catch (error) {
      console.error("Failed to start transcription:", error)
      onError?.("Failed to start transcription service")
      return false
    }
  }

  stop() {
    this.isListening = false

    if (this.useWebSpeechFallback && this.recognition) {
      this.recognition.stop()
      this.recognition = null
      this.useWebSpeechFallback = false
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ terminate_session: true }))
    }

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
      this.mediaRecorder = null
    }

    this.sessionId = null
  }

  isSupported(): boolean {
    const hasWebSocket = typeof WebSocket !== "undefined"
    const hasMediaDevices = typeof navigator.mediaDevices !== "undefined"
    const hasWebSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window

    return hasWebSocket && hasMediaDevices && hasWebSpeech
  }
}

export const speechService = new AssemblyAISpeechService({
  continuous: true,
  interimResults: true,
  sampleRate: 16000,
})
