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
  private isListening = false
  private onResult: ((result: TranscriptionResult) => void) | null = null
  private onError: ((error: string) => void) | null = null
  private recognition: any = null
  private readonly sampleRate: number

  constructor(options: SpeechToTextOptions = {}) {
    this.sampleRate = options.sampleRate ?? 16000
  }

  private setupWebSpeechAPI(): void {
    console.log("Setting up Web Speech API...")
    
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Speech recognition not supported in this browser")
      throw new Error("Speech recognition not supported")
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = "en-US"

    this.recognition.onstart = () => {
      console.log("Web Speech API started successfully")
    }

    this.recognition.onresult = (event: any) => {
      console.log("Web Speech API result:", event)
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
      console.log("Web Speech API ended")
      if (this.isListening) {
        // Restart if we're still supposed to be listening
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            console.log("Restarting Web Speech API...")
            this.recognition.start()
          }
        }, 100)
      }
    }
    
    console.log("Web Speech API setup complete")
  }

  async start(onResult: (result: TranscriptionResult) => void, onError?: (error: string) => void): Promise<boolean> {
    console.log("Speech service start called")
    
    if (this.isListening) {
      console.log("Already listening, returning true")
      return true
    }

    this.onResult = onResult
    this.onError = onError || null

    try {
      console.log("Setting up Web Speech API...")
      this.setupWebSpeechAPI()
      this.recognition.start()
      
      this.isListening = true
      console.log("Speech service started successfully")
      return true
    } catch (error) {
      console.error("Failed to start transcription:", error)
      if (this.onError) {
        this.onError(`Failed to start transcription service: ${error instanceof Error ? error.message : String(error)}`)
      }
      return false
    }
  }

  stop() {
    console.log("Stopping speech service...")
    this.isListening = false

    if (this.recognition) {
      this.recognition.stop()
      this.recognition = null
    }

    console.log("Speech service stopped")
  }

  isSupported(): boolean {
    const hasWebSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    return hasWebSpeech
  }
}

export const speechService = new AssemblyAISpeechService({
  continuous: true,
  interimResults: true,
  sampleRate: 16000,
})
