"use client"

import { MissionHeader } from "./mission-header"
import { PrimaryViewport } from "./primary-viewport"
import { TelemetryGrid } from "./telemetry-grid"
import { IncidentLog } from "./incident-log"
import { ControlPanel } from "./control-panel"

export function MissionDashboard() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <MissionHeader />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Incident Log */}
        <aside className="w-72 shrink-0 border-r border-border">
          <IncidentLog />
        </aside>

        {/* Center Area */}
        <main className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
          {/* Primary Viewport */}
          <div className="flex-1 min-h-0">
            <PrimaryViewport />
          </div>

          {/* Control Panel + Telemetry */}
          <div className="flex flex-col gap-3">
            <ControlPanel />
            <TelemetryGrid />
          </div>
        </main>
      </div>
    </div>
  )
}
