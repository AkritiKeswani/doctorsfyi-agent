"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Clock, User, Download, FileText, History } from "lucide-react"
import type { SessionData } from "@/lib/session-manager"

interface SessionHistoryPanelProps {
  sessions: SessionData[]
  onExportSession: (sessionId: string) => void
  onLoadSession?: (sessionId: string) => void
}

export function SessionHistoryPanel({ sessions, onExportSession, onLoadSession }: SessionHistoryPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return "Unknown"
    const minutes = Math.round(duration / 60000)
    return `${minutes} min`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Session History
          {sessions.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {sessions.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Sessions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-64 w-full">
          {sessions.length === 0 ? (
            <div className="flex items-center justify-center h-32 px-4">
              <p className="text-sm text-gray-500 italic">No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {sessions.map((session) => (
                <div key={session.id} className="p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">{session.patientInfo.name}</span>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>MRN: {session.patientInfo.mrn}</div>
                    <div>Date: {new Date(session.startTime).toLocaleDateString()}</div>
                    <div>Time: {new Date(session.startTime).toLocaleTimeString()}</div>
                    <div>Duration: {formatDuration(session.duration)}</div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onExportSession(session.id)}
                      className="text-xs flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    {onLoadSession && session.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLoadSession(session.id)}
                        className="text-xs flex-1"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
