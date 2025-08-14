"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mic, Square, AlertCircle, RefreshCw, UserPlus, Download, Settings, Activity } from "lucide-react"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { TranscriptionPanel } from "@/components/transcription-panel"
import { SOAPStructureDialog } from "@/components/soap-structure-dialog"
import { speechService, type TranscriptionResult } from "@/lib/speech-to-text"
import { soapGenerator, type SOAPNote } from "@/lib/soap-generator"
import { sessionManager, type SessionData } from "@/lib/session-manager"
import { SessionHistoryPanel } from "@/components/session-history-panel" // Declared the missing import

export default function MedicalTranscriptionApp() {
  // Audio and transcription state
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcription, setTranscription] = useState("")
  const [interimTranscription, setInterimTranscription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  // SOAP note state
  const [soapNote, setSOAPNote] = useState<SOAPNote | null>(null)
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false)
  const [soapError, setSOAPError] = useState<string | null>(null)

  // Session management state
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [showSOAPStructure, setShowSOAPStructure] = useState(false)
  const [sessions, setSessions] = useState<SessionData[]>([])

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const soapGenerationTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSpeechSupported(speechService.isSupported())
    setSessions(sessionManager.getAllSessions())
  }, [])

  // Enhanced SOAP generation with session management
  const generateSOAPNote = useCallback(
    async (text: string) => {
      if (!text.trim() || text.length < 50) return

      setIsGeneratingSOAP(true)
      setSOAPError(null)

      try {
        const newSOAP = await soapGenerator.generateIncrementalSOAP(text, soapNote || undefined)
        setSOAPNote(newSOAP)

        // Update current session with SOAP note
        if (currentSession) {
          sessionManager.updateSession(currentSession.id, { soapNote: newSOAP })
          setCurrentSession(sessionManager.getCurrentSession())
        }
      } catch (error) {
        console.error("SOAP generation error:", error)
        setSOAPError("Failed to generate SOAP note. Please try again.")
      } finally {
        setIsGeneratingSOAP(false)
      }
    },
    [soapNote, currentSession],
  )

  const triggerSOAPGeneration = useCallback(
    (text: string) => {
      if (soapGenerationTimerRef.current) {
        clearTimeout(soapGenerationTimerRef.current)
      }

      soapGenerationTimerRef.current = setTimeout(() => {
        generateSOAPNote(text)
      }, 3000)
    },
    [generateSOAPNote],
  )

  // Enhanced session management
  const startNewSessionAndRecording = async () => {
    console.log("Starting new session and recording...")
    
    // Complete current session if exists
    if (currentSession && currentSession.status === "active") {
      sessionManager.completeSession(currentSession.id)
    }

    // Create new session with default patient info
    const defaultPatientInfo = {
      name: `Patient ${Date.now()}`,
      mrn: `MRN${Date.now()}`,
      dob: new Date().toISOString().split("T")[0],
      gender: "Not specified" as const,
    }

    const sessionId = sessionManager.createSession(defaultPatientInfo)
    const newSession = sessionManager.getCurrentSession()
    setCurrentSession(newSession)

    // Reset transcription and SOAP state
    setTranscription("")
    setInterimTranscription("")
    setSOAPNote(null)
    setSOAPError(null)

    // Update sessions list
    setSessions(sessionManager.getAllSessions())

    // Automatically start recording
    try {
      setError(null)
      setSOAPError(null)

      console.log("Checking speech support...")
      console.log("Speech supported:", speechSupported)
      
      if (!speechSupported) {
        setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.")
        return
      }

      console.log("Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })

      console.log("Microphone access granted:", stream)
      streamRef.current = stream

      console.log("Setting up audio context...")
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      console.log("Setting up media recorder...")
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Audio chunk captured:", event.data.size, "bytes")
        }
      }

      mediaRecorder.start(1000)
      console.log("Media recorder started")

      console.log("Starting speech service...")
      const speechStarted = await speechService.start(
        (result: TranscriptionResult) => {
          console.log("Speech result received:", result)
          if (result.isFinal) {
            const newTranscription = transcription + " " + result.text
            setTranscription(newTranscription)
            setInterimTranscription("")

            // Update session with new transcription
            if (currentSession) {
              sessionManager.updateSession(currentSession.id, { transcription: newTranscription })
            }

            triggerSOAPGeneration(newTranscription)
          } else {
            setInterimTranscription(result.text)
          }
        },
        (error: string) => {
          console.error("Speech service error:", error)
          setError(error)
        },
      )

      console.log("Speech service started:", speechStarted)

      if (!speechStarted) {
        throw new Error("Failed to start speech recognition")
      }

      setIsRecording(true)
      monitorAudioLevel()
      console.log("Recording started successfully!")
    } catch (err) {
      console.error("Error starting recording:", err)
      setError(`Failed to access microphone or start speech recognition: ${err instanceof Error ? err.message : String(err)}. Please check permissions.`)
    }
  }

  const completeCurrentSession = () => {
    if (currentSession) {
      sessionManager.completeSession(currentSession.id)
      setCurrentSession(null)
      setSessions(sessionManager.getAllSessions())
    }
  }

  const exportSession = (sessionId: string) => {
    const exportData = sessionManager.exportSession(sessionId)
    const blob = new Blob([exportData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medical_session_${sessionId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }

    speechService.stop()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setAudioLevel(0)
    setInterimTranscription("")

    if (transcription.trim()) {
      generateSOAPNote(transcription)
    }
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current || !isRecording) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)

      requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }

  const clearTranscription = () => {
    setTranscription("")
    setInterimTranscription("")
    setSOAPNote(null)
    setSOAPError(null)

    if (soapGenerationTimerRef.current) {
      clearTimeout(soapGenerationTimerRef.current)
    }

    // Update current session
    if (currentSession) {
      sessionManager.updateSession(currentSession.id, {
        transcription: "",
        soapNote: undefined,
      })
    }
  }

  const regenerateSOAP = () => {
    if (transcription.trim()) {
      generateSOAPNote(transcription)
    }
  }

  const downloadTranscript = () => {
    if (!currentSession || !transcription.trim()) {
      return
    }

    const timestamp = new Date().toLocaleString()
    const transcriptData = `
MEDICAL TRANSCRIPTION - HIPAA COMPLIANT EXPORT
Generated: ${timestamp}
Session ID: ${currentSession.id}
Patient: ${currentSession.patientInfo.name}
MRN: ${currentSession.patientInfo.mrn}

=== RAW TRANSCRIPT ===
${transcription}

${
  soapNote
    ? `
=== SOAP NOTE ===
SUBJECTIVE:
${soapNote.subjective}

OBJECTIVE:
${soapNote.objective}

ASSESSMENT:
${soapNote.assessment}

PLAN:
${soapNote.plan}

=== MEDICAL CODES ===
ICD-10 Codes: ${soapNote.medicalCodes?.icd10Codes?.map((code) => `${code.code} - ${code.description}`).join(", ") || "None"}
CPT Codes: ${soapNote.medicalCodes?.cptCodes?.map((code) => `${code.code} - ${code.description}`).join(", ") || "None"}
`
    : ""
}

=== PRIVACY NOTICE ===
This transcript was generated using doctors.fyi-scribe.
Session data is automatically deleted from our servers after export.
Please transfer this information to your EMR system (Epic/Cerner) as needed.
    `.trim()

    const blob = new Blob([transcriptData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcript_${currentSession.patientInfo.name.replace(/\s+/g, "_")}_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    return () => {
      stopRecording()
      if (soapGenerationTimerRef.current) {
        clearTimeout(soapGenerationTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900">doctors.fyi-scribe</h1>
              <p className="text-sm text-gray-600">Professional SOAP note generation with automated coding</p>
            </div>

            <div className="flex items-center gap-4">
              <SessionHistoryPanel sessions={sessions} onExportSession={exportSession} />

              {currentSession && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{currentSession.patientInfo.name}</div>
                  <div className="text-xs text-gray-500">MRN: {currentSession.patientInfo.mrn}</div>
                </div>
              )}

              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Session Management Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col items-center space-y-4">
              {/* Main Button Row - Centered */}
              <div className="flex items-center justify-center">
                <Button
                  onClick={startNewSessionAndRecording}
                  className="bg-slate-600 hover:bg-slate-700"
                  disabled={!speechSupported}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Patient Session
                </Button>
              </div>

              {/* Session Status Row - Centered */}
              {currentSession && (
                <div className="flex items-center justify-center gap-4">
                  <Separator orientation="horizontal" className="w-32" />
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Activity className="h-3 w-3 mr-1" />
                      Active Session
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Started: {new Date(currentSession.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <Separator orientation="horizontal" className="w-32" />
                </div>
              )}

              {/* Action Buttons Row - Centered */}
              {currentSession && (
                <div className="flex items-center justify-center gap-2">
                  {transcription.trim() && (
                    <Button onClick={downloadTranscript} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Download className="h-4 w-4 mr-2" />
                      Download Transcript
                    </Button>
                  )}
                  <Button variant="outline" onClick={completeCurrentSession}>
                    Complete Session
                  </Button>
                  <Button variant="outline" onClick={() => exportSession(currentSession.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Session
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Improved Centering */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl w-full">
            {/* Recording Controls - Left Side */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Mic className="h-5 w-5" />
                    Audio Capture
                  </CardTitle>
                  <CardDescription>
                    {isRecording
                      ? "Recording in progress"
                      : currentSession
                        ? "Session active - Ready to record"
                        : "Start new session to begin"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!speechSupported && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-700">Speech recognition requires Chrome or Edge browser</p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {currentSession && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={isRecording ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"}`}
                          ></div>
                          {isRecording ? "Recording Active" : "Session Ready"}
                        </Badge>
                        {isRecording && (
                          <span className="text-sm text-gray-500">Level: {Math.round(audioLevel * 100)}%</span>
                        )}
                      </div>

                      {isRecording && <AudioVisualizer audioLevel={audioLevel} />}

                      {isRecording && (
                        <Button onClick={stopRecording} size="lg" variant="destructive" className="w-full">
                          <Square className="h-4 w-4 mr-2" />
                          Stop Recording
                        </Button>
                      )}

                      {transcription && !isRecording && (
                        <div className="space-y-2">
                          <Button
                            onClick={clearTranscription}
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                          >
                            Clear Transcription
                          </Button>
                          <Button
                            onClick={regenerateSOAP}
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                            disabled={isGeneratingSOAP}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingSOAP ? "animate-spin" : ""}`} />
                            Regenerate SOAP
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {isGeneratingSOAP && (
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing conversation...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* SOAP Notes and Transcription - Right Side */}
            <div className="lg:col-span-2">
              {currentSession ? (
                <TranscriptionPanel
                  transcription={transcription}
                  interimTranscription={interimTranscription}
                  isRecording={isRecording}
                  soapNote={soapNote}
                  isGeneratingSOAP={isGeneratingSOAP}
                  soapError={soapError}
                />
              ) : (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center text-gray-500">
                      <Mic className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                      <h3 className="text-xl font-medium mb-3">Ready to Begin</h3>
                      <p className="text-base mb-6 max-w-md mx-auto">
                        Click "New Patient Session" to automatically start recording and generating SOAP notes
                      </p>
                      <Button
                        onClick={() => setShowSOAPStructure(true)}
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Learn about SOAP Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SOAP Structure Dialog */}
      <SOAPStructureDialog open={showSOAPStructure} onOpenChange={setShowSOAPStructure} />
    </div>
  )
}
