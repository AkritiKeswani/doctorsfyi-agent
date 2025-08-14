"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle, Activity } from "lucide-react"
import { MedicalCodesPanel } from "./medical-codes-panel"
import type { SOAPNote } from "@/lib/soap-generator"

interface TranscriptionPanelProps {
  transcription: string
  interimTranscription?: string
  isRecording: boolean
  soapNote?: SOAPNote | null
  isGeneratingSOAP?: boolean
  soapError?: string | null
}

export function TranscriptionPanel({
  transcription,
  interimTranscription,
  isRecording,
  soapNote,
  isGeneratingSOAP,
  soapError,
}: TranscriptionPanelProps) {
  const fullText = transcription + (interimTranscription ? " " + interimTranscription : "")

  return (
    <div className="space-y-6">
      {/* SOAP Note - Now as primary element */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SOAP Note
            {isGeneratingSOAP && (
              <Badge variant="secondary" className="ml-auto">
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Structured medical documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {soapNote ? (
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-semibold text-blue-700 mb-2">Subjective</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {soapNote.subjective || "No subjective data recorded"}
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-semibold text-green-700 mb-2">Objective</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {soapNote.objective || "No objective data recorded"}
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <h4 className="font-semibold text-orange-700 mb-2">Assessment</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {soapNote.assessment || "No assessment recorded"}
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h4 className="font-semibold text-purple-700 mb-2">Plan</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{soapNote.plan || "No plan recorded"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {transcription
                ? "SOAP note will be generated from transcription..."
                : "Start recording to generate SOAP note"}
            </p>
          )}

          {soapError && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{soapError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Transcription - Moved below SOAP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Live Transcription
            {isRecording && (
              <Badge variant="destructive" className="ml-auto">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                Recording
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 w-full border rounded-md p-3">
            {fullText ? (
              <div className="text-sm">
                <span>{transcription}</span>
                {interimTranscription && <span className="text-blue-600 italic">{interimTranscription}</span>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isRecording ? "Listening..." : "Start recording to see transcription"}
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Medical Codes */}
      <MedicalCodesPanel medicalCoding={soapNote?.medicalCoding} isGenerating={isGeneratingSOAP} />
    </div>
  )
}
