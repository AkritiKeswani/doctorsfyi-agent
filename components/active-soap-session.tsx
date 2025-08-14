"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Save, Download, Activity } from "lucide-react"

interface ActiveSOAPSessionProps {
  isOpen: boolean
  onClose: () => void
  onSaveSession: (sessionData: any) => void
}

export function ActiveSOAPSession({ isOpen, onClose, onSaveSession }: ActiveSOAPSessionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [soapData, setSoapData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  })

  // Simulate real-time transcription and SOAP population
  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      // Simulate incoming transcript
      const samplePhrases = [
        "Patient reports chest pain for the past 2 hours",
        "Pain is sharp, radiating to left arm",
        "Blood pressure 140/90, heart rate 85",
        "EKG shows normal sinus rhythm",
        "Likely angina, rule out MI",
        "Start aspirin 81mg daily, follow up in 1 week",
      ]

      const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)]
      setTranscript((prev) => prev + (prev ? " " : "") + randomPhrase)

      // Simulate SOAP categorization
      if (randomPhrase.includes("reports") || randomPhrase.includes("pain")) {
        setSoapData((prev) => ({
          ...prev,
          subjective: prev.subjective + (prev.subjective ? " " : "") + randomPhrase,
        }))
      } else if (randomPhrase.includes("pressure") || randomPhrase.includes("rate") || randomPhrase.includes("EKG")) {
        setSoapData((prev) => ({
          ...prev,
          objective: prev.objective + (prev.objective ? " " : "") + randomPhrase,
        }))
      } else if (randomPhrase.includes("likely") || randomPhrase.includes("rule out")) {
        setSoapData((prev) => ({
          ...prev,
          assessment: prev.assessment + (prev.assessment ? " " : "") + randomPhrase,
        }))
      } else if (randomPhrase.includes("start") || randomPhrase.includes("follow up")) {
        setSoapData((prev) => ({
          ...prev,
          plan: prev.plan + (prev.plan ? " " : "") + randomPhrase,
        }))
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isRecording])

  const handleStartRecording = () => {
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
  }

  const handleSave = () => {
    const sessionData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      transcript,
      soapNote: soapData,
      duration: "15 minutes", // Mock duration
    }
    onSaveSession(sessionData)
    onClose()
    // Reset state
    setTranscript("")
    setSoapData({ subjective: "", objective: "", assessment: "", plan: "" })
    setIsRecording(false)
  }

  const handleDownload = () => {
    const content = `SOAP Note - ${new Date().toLocaleDateString()}

SUBJECTIVE:
${soapData.subjective || "No data recorded"}

OBJECTIVE:
${soapData.objective || "No data recorded"}

ASSESSMENT:
${soapData.assessment || "No data recorded"}

PLAN:
${soapData.plan || "No data recorded"}

RAW TRANSCRIPT:
${transcript || "No transcript available"}
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `soap-note-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Active Patient Session
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                Recording
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recording Controls */}
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button onClick={handleStartRecording} className="bg-green-600 hover:bg-green-700">
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={handleStopRecording} variant="destructive">
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* SOAP Note Structure */}
          <div className="grid gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-700">Subjective</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Patient's reported symptoms and history</p>
                <div className="bg-blue-50 p-3 rounded-md min-h-[60px]">
                  {soapData.subjective || (
                    <span className="text-gray-400 italic">
                      {isRecording
                        ? "Listening for patient symptoms..."
                        : "Start recording to capture patient information"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-700">Objective</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Observable findings and measurements</p>
                <div className="bg-green-50 p-3 rounded-md min-h-[60px]">
                  {soapData.objective || (
                    <span className="text-gray-400 italic">
                      {isRecording
                        ? "Listening for vital signs and observations..."
                        : "Start recording to capture objective data"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-700">Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Clinical diagnosis and reasoning</p>
                <div className="bg-orange-50 p-3 rounded-md min-h-[60px]">
                  {soapData.assessment || (
                    <span className="text-gray-400 italic">
                      {isRecording
                        ? "Listening for diagnostic information..."
                        : "Start recording to capture assessment"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-purple-700">Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Treatment plan and follow-up</p>
                <div className="bg-purple-50 p-3 rounded-md min-h-[60px]">
                  {soapData.plan || (
                    <span className="text-gray-400 italic">
                      {isRecording ? "Listening for treatment plans..." : "Start recording to capture treatment plan"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Transcript */}
          {transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto text-sm">{transcript}</div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleDownload} disabled={!transcript}>
              <Download className="h-4 w-4 mr-2" />
              Download Transcript
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!transcript}>
                <Save className="h-4 w-4 mr-2" />
                Save Session
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
