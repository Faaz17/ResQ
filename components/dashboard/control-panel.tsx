"use client"

import { useState } from "react"
import {
  Octagon,
  Siren,
  BrainCircuit,
  Power,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function ControlPanel() {
  const [autonomousMode, setAutonomousMode] = useState(true)
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [signalDeployed, setSignalDeployed] = useState(false)

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
      <div className="flex items-center gap-1.5 mr-2">
        <Power className="h-3.5 w-3.5 text-[hsl(var(--orange))]" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
          Control Panel
        </span>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Emergency Stop */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setEmergencyActive(!emergencyActive)}
        className={`gap-2 font-mono text-xs uppercase tracking-wider ${
          emergencyActive
            ? "animate-pulse-glow bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]"
            : "bg-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))/0.25] border border-[hsl(var(--destructive))/0.3]"
        }`}
      >
        <Octagon className="h-4 w-4" />
        {emergencyActive ? "E-STOP ACTIVE" : "Emergency Stop"}
      </Button>

      {/* Deploy Rescue Signal */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSignalDeployed(!signalDeployed)}
        className={`gap-2 font-mono text-xs uppercase tracking-wider ${
          signalDeployed
            ? "border-[hsl(var(--orange))] bg-[hsl(var(--orange))/0.15] text-[hsl(var(--orange))]"
            : "border-border bg-transparent text-muted-foreground hover:border-[hsl(var(--orange))/0.5] hover:text-[hsl(var(--orange))]"
        }`}
      >
        <Siren className={`h-4 w-4 ${signalDeployed ? "animate-pulse" : ""}`} />
        {signalDeployed ? "Signal Active" : "Deploy Rescue Signal"}
      </Button>

      {/* Autonomous VLM Mode Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAutonomousMode(!autonomousMode)}
        className={`gap-2 font-mono text-xs uppercase tracking-wider ${
          autonomousMode
            ? "border-[hsl(var(--success))] bg-[hsl(var(--success))/0.1] text-[hsl(var(--success))]"
            : "border-border bg-transparent text-muted-foreground hover:border-[hsl(var(--orange))/0.5] hover:text-foreground"
        }`}
      >
        <BrainCircuit className="h-4 w-4" />
        VLM Auto: {autonomousMode ? "ON" : "OFF"}
      </Button>

      {/* Status Indicators */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${autonomousMode ? "bg-[hsl(var(--success))]" : "bg-muted-foreground"}`} />
          <span className="font-mono text-[10px] text-muted-foreground">AUTO</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${signalDeployed ? "bg-[hsl(var(--orange))]" : "bg-muted-foreground"}`} />
          <span className="font-mono text-[10px] text-muted-foreground">BEACON</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${emergencyActive ? "bg-[hsl(var(--destructive))] animate-pulse" : "bg-[hsl(var(--success))]"}`} />
          <span className="font-mono text-[10px] text-muted-foreground">MOTORS</span>
        </div>
      </div>
    </div>
  )
}
