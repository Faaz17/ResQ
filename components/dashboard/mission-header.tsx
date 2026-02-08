"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Radio,
  Shield,
  ShieldCheck,
} from "lucide-react"

export function MissionHeader() {
  const [clock, setClock] = useState("00:00:00")
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const diff = Date.now() - start
      setElapsed(diff)
      const hrs = String(Math.floor(diff / 3600000)).padStart(2, "0")
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0")
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0")
      setClock(`${hrs}:${mins}:${secs}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      {/* Left: Unit Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[hsl(var(--orange))]" />
          <span className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
            ResQ-Agent
          </span>
          <span className="rounded border border-[hsl(var(--orange))/0.3] bg-[hsl(var(--orange))/0.1] px-2 py-0.5 font-mono text-xs text-[hsl(var(--orange))]">
            Alpha Unit
          </span>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--destructive))] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))]" />
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[hsl(var(--destructive))]">
            Live
          </span>
        </div>
      </div>

      {/* Center: Mission Clock */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">MISSION ELAPSED</span>
          <span className="font-mono text-sm font-bold tabular-nums text-foreground">
            {clock}
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[hsl(var(--success))]" />
          <span className="font-mono text-xs text-muted-foreground">STATUS</span>
          <span className="font-mono text-xs font-semibold text-[hsl(var(--success))]">
            OPERATIONAL
          </span>
        </div>
      </div>

      {/* Right: Hazard Level */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded border border-[hsl(var(--success))/0.3] bg-[hsl(var(--success))/0.08] px-3 py-1">
          <ShieldCheck className="h-4 w-4 text-[hsl(var(--success))]" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Env Hazard</span>
            <span className="font-mono text-xs font-bold text-[hsl(var(--success))]">
              NO GAS LEAK FOUND
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Threat Level</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 w-3 rounded-sm ${
                  i <= 1
                    ? "bg-[hsl(var(--success))]"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
