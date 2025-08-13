"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PatientInfo } from "@/lib/session-manager"

interface PatientInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (patientInfo: PatientInfo) => void
}

export function PatientInfoDialog({ open, onOpenChange, onSubmit }: PatientInfoDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    mrn: "",
    insurance: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.dateOfBirth || !formData.mrn) {
      return
    }

    const patientInfo: PatientInfo = {
      id: `patient_${Date.now()}`,
      name: formData.name,
      dateOfBirth: formData.dateOfBirth,
      mrn: formData.mrn,
      insurance: formData.insurance || undefined,
    }

    onSubmit(patientInfo)
    onOpenChange(false)

    // Reset form
    setFormData({
      name: "",
      dateOfBirth: "",
      mrn: "",
      insurance: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Patient Session</DialogTitle>
          <DialogDescription>Enter patient information to start a new transcription session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mrn" className="text-right">
                MRN *
              </Label>
              <Input
                id="mrn"
                value={formData.mrn}
                onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dob" className="text-right">
                DOB *
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="insurance" className="text-right">
                Insurance
              </Label>
              <Input
                id="insurance"
                value={formData.insurance}
                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Start Session</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
