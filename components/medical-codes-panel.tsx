import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Code, Stethoscope, Activity } from "lucide-react"
import type { MedicalCoding, ICD10Code, CPTCode } from "@/lib/medical-codes"

interface MedicalCodesPanelProps {
  medicalCoding?: MedicalCoding | null
  isGenerating?: boolean
}

export function MedicalCodesPanel({ medicalCoding, isGenerating }: MedicalCodesPanelProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getSeverityColor = (severity?: string) => {
    return severity === "primary" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Medical Codes
        </CardTitle>
        <CardDescription>AI-generated ICD-10 diagnostic and CPT procedure codes</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full">
          {isGenerating ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">Generating medical codes...</div>
            </div>
          ) : medicalCoding && (medicalCoding.icd10Codes.length > 0 || medicalCoding.cptCodes.length > 0) ? (
            <div className="space-y-4">
              {/* ICD-10 Diagnostic Codes */}
              {medicalCoding.icd10Codes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-700">ICD-10 Diagnostic Codes</h4>
                  </div>
                  <div className="space-y-2">
                    {medicalCoding.icd10Codes.map((code: ICD10Code, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {code.code}
                            </Badge>
                            <Badge variant="secondary" className={getSeverityColor(code.severity)}>
                              {code.severity}
                            </Badge>
                          </div>
                          <Badge variant="secondary" className={getConfidenceColor(code.confidence)}>
                            {Math.round(code.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{code.description}</p>
                        {code.category && <p className="text-xs text-gray-500">Category: {code.category}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Separator if both types exist */}
              {medicalCoding.icd10Codes.length > 0 && medicalCoding.cptCodes.length > 0 && (
                <Separator className="my-4" />
              )}

              {/* CPT Procedure Codes */}
              {medicalCoding.cptCodes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-green-700">CPT Procedure Codes</h4>
                  </div>
                  <div className="space-y-2">
                    {medicalCoding.cptCodes.map((code: CPTCode, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {code.code}
                            </Badge>
                            {code.modifier && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                {code.modifier}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className={getConfidenceColor(code.confidence)}>
                            {Math.round(code.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{code.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {code.category && <span>Category: {code.category}</span>}
                          {code.units && <span>Units: {code.units}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall confidence and timestamp */}
              {medicalCoding.confidence > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Overall Confidence: {Math.round(medicalCoding.confidence * 100)}% • Generated:{" "}
                    {new Date(medicalCoding.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-500 italic">Medical codes will appear here after SOAP note generation</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
