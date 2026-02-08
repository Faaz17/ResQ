"use client"

import React from "react"

import { useEffect, useState } from "react"
import {
  Battery,
  MapPin,
  Signal,
  TriangleAlert,
} from "lucide-react"

interface TelemetryData {
  battery: number
  signal: number
  coords: { x: number; y: number; z: number }
  proximity: number
}

function useTelemetry(): TelemetryData {
  const [data, setData] = useState<TelemetryData>({
    battery: 78,
    signal: 92,
    coords: { x: 12.45, y: -3.22, z: 0.87 },
    proximity: 1.8,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        battery: Math.max(5, prev.battery - (Math.random() * 0.3)),
        signal: Math.min(100, Math.max(40, prev.signal + (Math.random() - 0.5) * 8)),
        coords: {
          x: +(prev.coords.x + (Math.random() - 0.45) * 0.3).toFixed(2),
          y: +(prev.coords.y + (Math.random() - 0.5) * 0.2).toFixed(2),
          z: +(prev.coords.z + (Math.random() - 0.5) * 0.05).toFixed(2),
        },
        proximity: Math.max(0.2, +(prev.proximity + (Math.random() - 0.5) * 0.5).toFixed(1)),
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return data
}

function TelemetryCard({
  icon: Icon,
  label,
  children,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
  status: "nominal" | "warning" | "critical"
}) {
  const statusColor = {
    nominal: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    critical: "text-[hsl(var(--destructive))]",
  }

  const borderColor = {
    nominal: "border-border",
    warning: "border-[hsl(var(--warning))/0.3]",
    critical: "border-[hsl(var(--destructive))/0.3]",
  }

  return (
    <div className={`rounded-md border ${borderColor[status]} bg-card p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-3.5 w-3.5 ${statusColor[status]}`} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className={`ml-auto h-1.5 w-1.5 rounded-full ${
          status === "nominal" ? "bg-[hsl(var(--success))]" :
          status === "warning" ? "bg-[hsl(var(--warning))]" :
          "bg-[hsl(var(--destructive))]"
        }`} />
      </div>
      {children}
    </div>
  )
}

export function TelemetryGrid() {
  const data = useTelemetry()

  const batteryStatus = data.battery > 30 ? "nominal" : data.battery > 15 ? "warning" : "critical"
  const signalStatus = data.signal > 60 ? "nominal" : data.signal > 30 ? "warning" : "critical"
  const proximityStatus = data.proximity > 1.5 ? "nominal" : data.proximity > 0.5 ? "warning" : "critical"

  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Battery */}
      <TelemetryCard icon={Battery} label="Battery" status={batteryStatus}>
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {Math.round(data.battery)}
          </span>
          <span className="mb-1 font-mono text-xs text-muted-foreground">%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              batteryStatus === "nominal"
                ? "bg-[hsl(var(--success))]"
                : batteryStatus === "warning"
                ? "bg-[hsl(var(--warning))]"
                : "bg-[hsl(var(--destructive))]"
            }`}
            style={{ width: `${data.battery}%` }}
          />
        </div>
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
          EST. {Math.round(data.battery * 1.5)}min remaining
        </span>
      </TelemetryCard>

      {/* Signal Strength */}
      <TelemetryCard icon={Signal} label="Signal Strength" status={signalStatus}>
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {Math.round(data.signal)}
          </span>
          <span className="mb-1 font-mono text-xs text-muted-foreground">dBm</span>
        </div>
        <div className="mt-2 flex items-end gap-0.5">
          {[20, 40, 60, 80, 100].map((threshold, i) => (
            <div
              key={threshold}
              className={`w-2 rounded-sm transition-all duration-500 ${
                data.signal >= threshold
                  ? signalStatus === "nominal"
                    ? "bg-[hsl(var(--success))]"
                    : "bg-[hsl(var(--warning))]"
                  : "bg-muted"
              }`}
              style={{ height: `${8 + i * 4}px` }}
            />
          ))}
        </div>
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
          Latency: {Math.round(30 + Math.random() * 20)}ms
        </span>
      </TelemetryCard>

      {/* Coordinates */}
      <TelemetryCard icon={MapPin} label="Rover Coordinates" status="nominal">
        <div className="grid grid-cols-3 gap-2">
          {(["x", "y", "z"] as const).map((axis) => (
            <div key={axis} className="flex flex-col">
              <span className="font-mono text-[10px] uppercase text-[hsl(var(--orange))]">{axis}</span>
              <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                {data.coords[axis].toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <span className="mt-2 block font-mono text-[10px] text-muted-foreground">
          Building B, Floor 2, Sector 4
        </span>
      </TelemetryCard>

      {/* Obstacle Proximity */}
      <TelemetryCard icon={TriangleAlert} label="Obstacle Proximity" status={proximityStatus}>
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {data.proximity.toFixed(1)}
          </span>
          <span className="mb-1 font-mono text-xs text-muted-foreground">m</span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {[...Array(10)].map((_, i) => {
            const filled = i < Math.round(data.proximity * 2)
            return (
              <div
                key={i}
                className={`h-3 flex-1 rounded-sm transition-all duration-300 ${
                  filled
                    ? i < 3
                      ? "bg-[hsl(var(--destructive))]"
                      : i < 6
                      ? "bg-[hsl(var(--warning))]"
                      : "bg-[hsl(var(--success))]"
                    : "bg-muted"
                }`}
              />
            )
          })}
        </div>
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
          LIDAR active // 360deg scan
        </span>
      </TelemetryCard>
    </div>
  )
}
