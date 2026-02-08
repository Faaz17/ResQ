"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Flame,
  Skull,
  User,
  Zap,
  FileWarning,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"

interface Incident {
  id: number
  time: string
  title: string
  type: "hazard" | "victim" | "structural" | "electrical" | "fire" | "info" | "safe"
  description: string
  severity: "low" | "medium" | "high" | "critical"
}

const INCIDENTS: Incident[] = [
  {
    id: 1,
    time: "12:01",
    title: "Mission Start",
    type: "info",
    description: "ResQ-Agent Alpha Unit deployed. VLM active. Beginning systematic search of Building B, Floor 2.",
    severity: "low",
  },
  {
    id: 2,
    time: "12:02",
    title: "Structural Damage Mapped",
    type: "structural",
    description: "South corridor ceiling collapse detected. 60% blockage. Rerouting through corridor B.",
    severity: "medium",
  },
  {
    id: 3,
    time: "12:04",
    title: "No Exposed Wiring Hazard",
    type: "safe",
    description: "Electrical scan complete at junction B-204. No live wiring detected. Area cleared as safe.",
    severity: "low",
  },
  {
    id: 4,
    time: "12:07",
    title: "No Gas Leak Found",
    type: "safe",
    description: "Methane sensor reading 0.0% LEL. All pipes intact. No gas leak detected in the area.",
    severity: "low",
  },
  {
    id: 5,
    time: "12:09",
    title: "Thermal Signature Detected",
    type: "fire",
    description: "Elevated temperature 89C in adjacent room. Possible smoldering fire behind wall.",
    severity: "high",
  },
  {
    id: 6,
    time: "12:12",
    title: "VICTIM: Human Arm Under Debris",
    type: "victim",
    description: "VLM detected human limb visible under concrete debris. Thermal confirms 36.8C body heat. Subject appears conscious.",
    severity: "critical",
  },
  {
    id: 7,
    time: "12:14",
    title: "Rescue Signal Deployed",
    type: "info",
    description: "Emergency beacon activated at victim location. GPS coordinates transmitted to base. ETA rescue team: 8 min.",
    severity: "medium",
  },
]

const TYPE_CONFIG = {
  hazard: { icon: AlertTriangle, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))/0.1]" },
  victim: { icon: User, color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive))/0.1]" },
  structural: { icon: FileWarning, color: "text-[hsl(var(--orange))]", bg: "bg-[hsl(var(--orange))/0.1]" },
  electrical: { icon: Zap, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))/0.1]" },
  fire: { icon: Flame, color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive))/0.1]" },
  info: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  safe: { icon: CheckCircle2, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))/0.1]" },
}

const SEVERITY_CONFIG = {
  low: "border-l-muted-foreground",
  medium: "border-l-[hsl(var(--orange))]",
  high: "border-l-[hsl(var(--warning))]",
  critical: "border-l-[hsl(var(--destructive))]",
}

export function IncidentLog() {
  const [selected, setSelected] = useState<number | null>(6)

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Skull className="h-4 w-4 text-[hsl(var(--orange))]" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Incident Log
        </span>
        <span className="ml-auto rounded bg-[hsl(var(--destructive))/0.15] px-1.5 py-0.5 font-mono text-[10px] text-[hsl(var(--destructive))]">
          {INCIDENTS.length}
        </span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {INCIDENTS.map((incident) => {
          const config = TYPE_CONFIG[incident.type]
          const Icon = config.icon
          const isSelected = selected === incident.id
          const severityBorder = SEVERITY_CONFIG[incident.severity]

          return (
            <button
              key={incident.id}
              type="button"
              onClick={() => setSelected(isSelected ? null : incident.id)}
              className={`w-full border-l-2 ${severityBorder} border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                isSelected ? "bg-muted/30" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 rounded p-1 ${config.bg}`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {incident.time}
                    </span>
                    {incident.severity === "critical" && (
                      <span className="animate-pulse rounded bg-[hsl(var(--destructive))] px-1 py-px font-mono text-[8px] font-bold uppercase text-[hsl(var(--destructive-foreground))]">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs font-medium text-foreground">
                    {incident.title}
                  </p>

                  {isSelected && (
                    <div className="mt-2 space-y-2">
                      {/* Simulated thumbnail */}
                      <div className="relative h-20 w-full overflow-hidden rounded border border-border bg-[hsl(220,14%,5%)]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <Icon className={`h-5 w-5 ${config.color} opacity-40`} />
                            <span className="font-mono text-[8px] text-muted-foreground">
                              CAM CAPTURE // {incident.time}:00
                            </span>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-card/80 px-1.5 py-0.5">
                          <span className="font-mono text-[8px] text-muted-foreground">
                            FRM 00{incident.id * 127}
                          </span>
                        </div>
                      </div>
                      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                        {incident.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
