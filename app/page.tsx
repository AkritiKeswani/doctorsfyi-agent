"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, History, AlertCircle } from "lucide-react"
import { ActiveSOAPSession } from "@/components/active-soap-session"
import { SOAPStructureDialog } from "@/components/soap-structure-dialog"
import { speechService } from "@/lib/speech-to-text"
import { sessionManager, type SessionData } from "@/lib/session-manager"

export default function MedicalTranscriptionApp() {
  const [showActiveSession, setShowActiveSession] = useState(false)
  const [showSOAPStructure, setShowSOAPStructure] = useState(false)
  const [showSessionHistory, setShowSessionHistory] = useState(false)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [speechSupported, setSpeechSupported] = useState(true)

  useEffect(() => {
    setSpeechSupported(speechService.isSupported())
    setSessions(sessionManager.getAllSessions())
  }, [])

  const handleNewPatientSession = () => {
    setShowActiveSession(true)
  }

  const handleSaveSession = (sessionData: any) => {
    const savedSession = sessionManager.createSessionFromData(sessionData)
    setSessions(sessionManager.getAllSessions())
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">doctors.fyi-scribe</h1>
            <p className="text-lg text-gray-600">AI-powered medical transcription and SOAP note generation</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <UserPlus className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">Ready to Begin</h2>
              <p className="text-gray-600 text-lg max-w-lg">
                Start a new patient session to automatically begin recording and generate SOAP notes in real-time
              </p>
            </div>
          </div>

          <Button
            onClick={handleNewPatientSession}
            size="lg"
            className="bg-slate-600 hover:bg-slate-700 text-white px-12 py-6 text-xl font-medium"
            disabled={!speechSupported}
          >
            <UserPlus className="h-6 w-6 mr-3" />
            New Patient Session
          </Button>

          {!speechSupported && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-700">Speech recognition requires Chrome or Edge browser</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={() => setShowSOAPStructure(true)}
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Learn about SOAP Notes
            </Button>

            {sessions.length > 0 && (
              <Button
                onClick={() => setShowSessionHistory(true)}
                variant="outline"
                className="text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                <History className="h-4 w-4 mr-2" />
                Session History ({sessions.length})
              </Button>
            )}
          </div>
        </div>

        {showSessionHistory && sessions.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Session History</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSessionHistory(false)}>
                  Hide
                </Button>
              </div>
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{session.patientInfo.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.startTime).toLocaleDateString()} at{" "}
                        {new Date(session.startTime).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Transcript: {session.transcription?.substring(0, 100)}...
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => exportSession(session.id)}>
                      Export
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ActiveSOAPSession
        isOpen={showActiveSession}
        onClose={() => setShowActiveSession(false)}
        onSaveSession={handleSaveSession}
      />

      {/* SOAP Structure Dialog */}
      <SOAPStructureDialog open={showSOAPStructure} onOpenChange={setShowSOAPStructure} />
    </div>
  )
}
