"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Shield, Download } from "lucide-react"

interface SOAPStructureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SOAPStructureDialog({ open, onOpenChange }: SOAPStructureDialogProps) {
  const handleStartSession = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Patient Session - SOAP Note Structure
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            HIPAA Compliant - Session data is temporary and auto-deleted after session ends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  S
                </Badge>
                Subjective
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auto-populated from patient's words: Chief complaint, symptoms, pain levels, medical history, and
                patient's description of their condition.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  O
                </Badge>
                Objective
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auto-populated from doctor's observations: Physical examination findings, vital signs, lab results, and
                diagnostic test results mentioned during conversation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  A
                </Badge>
                Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auto-populated with AI-suggested diagnoses and ICD-10 codes based on symptoms and findings discussed.
                Includes differential diagnoses and clinical reasoning.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  P
                </Badge>
                Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auto-populated with treatment plans, medications, CPT codes, follow-up instructions, and next steps
                mentioned during the consultation.
              </p>
            </CardContent>
          </Card>

          <div className="bg-slate-50 p-4 rounded-lg border">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">HIPAA Compliance & Data Handling</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• All session data is temporarily cached during recording only</li>
                  <li>• Data is automatically deleted when session ends</li>
                  <li>• Use the download button to export transcript for Epic/Cerner</li>
                  <li>• No patient data is permanently stored on our servers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" size="sm" className="text-xs bg-transparent">
            <Download className="h-3 w-3 mr-1" />
            Download transcript after session
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartSession} className="bg-slate-600 hover:bg-slate-700">
              <FileText className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
