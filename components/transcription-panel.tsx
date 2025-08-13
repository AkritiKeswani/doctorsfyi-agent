"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle, CheckCircle, Activity, Clock, User, Stethoscope, Brain, Clipboard } from "lucide-react"
import { MedicalCodesPanel } from "./medical-codes-panel"
import type { SOAPNote } from "@/lib/soap-generator"
import { useState, useEffect } from "react"

interface TranscriptionPanelProps {
  transcription: string
  interimTranscription?: string
  isRecording: boolean
  soapNote?: SOAPNote | null
  isGeneratingSOAP?: boolean
  soapError?: string | null
}

const simulatedSOAPContent = {
  subjective: [
    "Patient reports chest pain for 2 days...",
    "Patient reports chest pain for 2 days, describes as sharp, stabbing sensation...",
    "Patient reports chest pain for 2 days, describes as sharp, stabbing sensation, 7/10 severity, worse with deep inspiration...",
    "Patient reports chest pain for 2 days, describes as sharp, stabbing sensation, 7/10 severity, worse with deep inspiration. Denies shortness of breath, palpitations, or radiation to arms. No recent trauma or illness.",
  ],
  objective: [
    "Vitals: BP 140/90, HR 88...",
    "Vitals: BP 140/90, HR 88, Temp 98.6°F, RR 16, O2 Sat 98%...",
    "Vitals: BP 140/90, HR 88, Temp 98.6°F, RR 16, O2 Sat 98%. Cardiac exam reveals regular rate and rhythm...",
    "Vitals: BP 140/90, HR 88, Temp 98.6°F, RR 16, O2 Sat 98%. Cardiac exam reveals regular rate and rhythm, no murmurs. Lungs clear to auscultation bilaterally. Chest wall tender to palpation over left 4th intercostal space.",
  ],
  assessment: [
    "Primary diagnosis: Acute chest pain...",
    "Primary diagnosis: Acute chest pain, likely musculoskeletal origin...",
    "Primary diagnosis: Acute chest pain, likely musculoskeletal origin. Rule out cardiac etiology...",
    "Primary diagnosis: Acute chest pain, likely musculoskeletal origin. Rule out cardiac etiology. Differential includes costochondritis, muscle strain, or atypical presentation of cardiac ischemia. Low probability for PE given clinical presentation.",
  ],
  plan: [
    "Order ECG and chest X-ray...",
    "Order ECG and chest X-ray. Start NSAIDs for pain management...",
    "Order ECG and chest X-ray. Start NSAIDs for pain management. Patient education on activity modification...",
    "Order ECG and chest X-ray. Start NSAIDs for pain management. Patient education on activity modification. Follow up in 48 hours if symptoms persist or worsen. Return immediately for severe chest pain, shortness of breath, or palpitations.",
  ],
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

  const [simulatedSOAP, setSimulatedSOAP] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  })
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    if (transcription && !soapNote && !isSimulating) {
      setIsSimulating(true)

      // Simulate progressive content population
      const sections = ["subjective", "objective", "assessment", "plan"] as const
      let currentSection = 0
      let currentStep = 0

      const interval = setInterval(() => {
        if (currentSection < sections.length) {
          const section = sections[currentSection]
          const content = simulatedSOAPContent[section]

          if (currentStep < content.length) {
            setSimulatedSOAP((prev) => ({
              ...prev,
              [section]: content[currentStep],
            }))
            currentStep++
          } else {
            currentSection++
            currentStep = 0
          }
        } else {
          clearInterval(interval)
          setIsSimulating(false)
        }
      }, 2000) // Update every 2 seconds

      return () => clearInterval(interval)
    }
  }, [transcription, soapNote, isSimulating])

  const displaySOAP = soapNote || (transcription ? simulatedSOAP : null)

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
                <FileText className="h-6 w-6" />
                Active SOAP Note
              </CardTitle>
              <CardDescription className="text-blue-700">Real-time medical documentation structure</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isRecording && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  Recording Active
                </Badge>
              )}
              {(isGeneratingSOAP || isSimulating) && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Analyzing...
                </Badge>
              )}
              {displaySOAP && !isGeneratingSOAP && !isSimulating && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Generated
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subjective Section */}
            <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                  <User className="h-5 w-5" />
                  <span className="font-bold text-blue-800">S</span> Subjective
                </CardTitle>
                <CardDescription className="text-xs text-blue-600">
                  Patient's reported symptoms and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="text-sm leading-relaxed">
                    {displaySOAP?.subjective ? (
                      <p className="text-gray-900">{displaySOAP.subjective}</p>
                    ) : (
                      <p className="text-gray-500 italic">
                        {isRecording ? "Listening for patient complaints..." : "Chief complaint will appear here..."}
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {displaySOAP?.subjective && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {displaySOAP.subjective.length} characters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Objective Section */}
            <Card className="border-l-4 border-l-green-500 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <Stethoscope className="h-5 w-5" />
                  <span className="font-bold text-green-800">O</span> Objective
                </CardTitle>
                <CardDescription className="text-xs text-green-600">
                  Clinical observations and measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="text-sm leading-relaxed">
                    {displaySOAP?.objective ? (
                      <p className="text-gray-900">{displaySOAP.objective}</p>
                    ) : (
                      <p className="text-gray-500 italic">
                        {isRecording
                          ? "Capturing vital signs and exam findings..."
                          : "Vital signs and exam will appear here..."}
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {displaySOAP?.objective && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {displaySOAP.objective.length} characters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessment Section */}
            <Card className="border-l-4 border-l-orange-500 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <Brain className="h-5 w-5" />
                  <span className="font-bold text-orange-800">A</span> Assessment
                </CardTitle>
                <CardDescription className="text-xs text-orange-600">Clinical diagnosis and impression</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="text-sm leading-relaxed">
                    {displaySOAP?.assessment ? (
                      <p className="text-gray-900">{displaySOAP.assessment}</p>
                    ) : (
                      <p className="text-gray-500 italic">
                        {isRecording
                          ? "Analyzing for diagnostic impressions..."
                          : "Diagnosis and clinical reasoning will appear here..."}
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {displaySOAP?.assessment && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {displaySOAP.assessment.length} characters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Section */}
            <Card className="border-l-4 border-l-purple-500 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                  <Clipboard className="h-5 w-5" />
                  <span className="font-bold text-purple-800">P</span> Plan
                </CardTitle>
                <CardDescription className="text-xs text-purple-600">Treatment plan and follow-up</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="text-sm leading-relaxed">
                    {displaySOAP?.plan ? (
                      <p className="text-gray-900">{displaySOAP.plan}</p>
                    ) : (
                      <p className="text-gray-500 italic">
                        {isRecording ? "Developing treatment recommendations..." : "Treatment plan will appear here..."}
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {displaySOAP?.plan && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {displaySOAP.plan.length} characters
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {soapError && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{soapError}</p>
            </div>
          )}

          {displaySOAP && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Generated: {new Date().toLocaleTimeString()}
                {soapNote?.confidence && (
                  <span className="ml-2">AI Confidence: {Math.round(soapNote.confidence * 100)}%</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <MedicalCodesPanel medicalCoding={soapNote?.medicalCoding} isGenerating={isGeneratingSOAP || isSimulating} />

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <FileText className="h-5 w-5" />
            Live Transcription Feed
          </CardTitle>
          <CardDescription>Raw speech-to-text conversion</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 w-full border rounded-md p-4 bg-gray-50">
            {fullText ? (
              <div className="text-sm leading-relaxed font-mono">
                <span className="text-gray-900">{transcription}</span>
                {interimTranscription && (
                  <span className="text-blue-600 italic bg-blue-50 px-1 rounded"> {interimTranscription}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {isRecording ? "Listening for speech..." : "Start recording to see live transcription"}
              </p>
            )}
          </ScrollArea>
          {fullText && (
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span>Words: {fullText.split(" ").length}</span>
              <span>Characters: {fullText.length}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
