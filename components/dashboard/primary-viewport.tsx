"use client"

import { useEffect, useState } from "react"
import { Camera, Eye, Maximize2, WifiOff, Wifi, ShieldAlert, CheckCircle2 } from "lucide-react"
import { useWebotsCamera } from "@/hooks/use-webots-camera"

export function PrimaryViewport() {
  const [frameCount, setFrameCount] = useState(0)

  // Connect to Webots camera stream
  const { frame, connected, fps, victimDetected, aiStatus, aiResponse } = useWebotsCamera({
    url: "ws://localhost:8765",
    reconnectDelay: 2000,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameCount((prev) => prev + 1)
    }, 33)
    return () => clearInterval(interval)
  }, [])

  const isDetected = victimDetected

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border bg-card">
      {/* === LIVE WEBOTS CAMERA FEED === */}
      {frame ? (
        <img
          src={frame}
          alt="Webots Camera Feed"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        /* Fallback: No connection screen */
        <div className="absolute inset-0 bg-[hsl(220,14%,5%)]">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute left-[10%] top-[20%] h-32 w-48 rounded bg-[hsl(220,10%,10%)] opacity-60" />
          <div className="absolute left-[40%] top-[35%] h-24 w-36 skew-x-6 rounded bg-[hsl(220,10%,8%)] opacity-50" />
          <div className="absolute right-[15%] top-[25%] h-40 w-28 -skew-x-3 rounded bg-[hsl(220,10%,9%)] opacity-55" />
          <div className="absolute bottom-[20%] left-[25%] h-20 w-64 rounded bg-[hsl(220,10%,7%)] opacity-45" />
          <div className="animate-scanline absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--foreground))/0.02] to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <WifiOff className="h-8 w-8 text-muted-foreground/50" />
            <span className="font-mono text-xs text-muted-foreground/50">
              WAITING FOR WEBOTS FEED...
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/30">
              ws://localhost:8765
            </span>
          </div>
        </div>
      )}

      {/* Scanline effect over live feed */}
      {frame && (
        <div className="animate-scanline absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--foreground))/0.02] to-transparent pointer-events-none" />
      )}

      {/* === VICTIM DETECTED BOUNDING BOX === */}
      {isDetected && frame && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Pulsing red border around entire viewport */}
          <div className="absolute inset-0 border-4 border-[hsl(var(--destructive))] animate-pulse shadow-[inset_0_0_30px_hsl(var(--destructive)/0.2)]" />
          
          {/* Center bounding box */}
          <div
            className="absolute transition-all duration-700"
            style={{
              left: "15%",
              top: "10%",
              width: "70%",
              height: "80%",
            }}
          >
            <div className="h-full w-full border-2 border-[hsl(var(--destructive))] shadow-[0_0_20px_hsl(var(--destructive)/0.3)]">
              {/* Label */}
              <div className="absolute -top-6 left-0 px-2 py-0.5 font-mono text-xs font-bold bg-[hsl(var(--destructive))] text-white">
                🚨 VICTIM DETECTED — AI CONFIRMED
              </div>
              {/* Corner brackets */}
              <div className="absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-[hsl(var(--destructive))]" />
              <div className="absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 border-[hsl(var(--destructive))]" />
              <div className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-[hsl(var(--destructive))]" />
              <div className="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-[hsl(var(--destructive))]" />
            </div>
          </div>

          {/* Big alert text */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--destructive))] px-4 py-1.5 rounded">
            <span className="font-mono text-sm font-bold text-white tracking-wider animate-pulse">
              ⚠️ HUMAN DETECTED — ROBOT STOPPED
            </span>
          </div>
        </div>
      )}

      {/* Top-left HUD info */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <Camera className="h-3.5 w-3.5 text-[hsl(var(--orange))]" />
        <span className="font-mono text-[10px] uppercase text-[hsl(var(--orange))]">
          Webots Feed // CAM-01
        </span>
        <div className="flex items-center gap-1 ml-2">
          {connected ? (
            <>
              <Wifi className="h-3 w-3 text-[hsl(var(--chart-2))]" />
              <span className="font-mono text-[10px] text-[hsl(var(--chart-2))]">LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-muted-foreground/50" />
              <span className="font-mono text-[10px] text-muted-foreground/50">OFFLINE</span>
            </>
          )}
        </div>
      </div>

      {/* Top-right info */}
      <div className="absolute right-3 top-3 flex items-center gap-3">
        {connected && (
          <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--chart-2))]">
            {fps} FPS
          </span>
        )}
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {`FRM ${String(frameCount % 9999).padStart(4, "0")}`}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">1920x1080</span>
        <Maximize2 className="h-3.5 w-3.5 cursor-pointer text-muted-foreground transition-colors hover:text-foreground" />
      </div>

      {/* VLM Analysis Banner — changes based on REAL AI status */}
      <div
        className={`absolute bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-2 backdrop-blur-sm border-t ${
          isDetected
            ? "bg-[hsl(var(--success))/0.15] border-[hsl(var(--success))/0.4]"
            : aiStatus === "cooldown"
            ? "bg-[hsl(var(--warning))/0.1] border-[hsl(var(--warning))/0.3]"
            : "bg-card/60 border-border"
        }`}
      >
        {isDetected ? (
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
        ) : aiStatus === "cooldown" ? (
          <ShieldAlert className="h-4 w-4 text-[hsl(var(--warning))]" />
        ) : (
          <Eye className="h-4 w-4 text-[hsl(var(--orange))]" />
        )}
        <span className="font-mono text-[10px] uppercase text-muted-foreground">VLM Analysis</span>
        <span
          className={`font-mono text-xs font-bold ${
            isDetected
              ? "text-[hsl(var(--success))]"
              : aiStatus === "cooldown"
              ? "text-[hsl(var(--warning))]"
              : "text-[hsl(var(--orange))]"
          }`}
        >
          {!connected
            ? "Waiting for camera feed..."
            : isDetected
            ? "✅ VICTIM DETECTED — Robot Stopped"
            : aiStatus === "cooldown"
            ? "⏳ API cooldown — Retrying soon..."
            : aiStatus === "scanning"
            ? "Gemini AI Active — Scanning for victims..."
            : "Gemini AI Active — Scanning for victims..."
          }
        </span>
      </div>

      {/* Center crosshair (hide when victim detected) */}
      {!isDetected && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-8 w-8">
            <div className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-[hsl(var(--orange))/0.4]" />
            <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-[hsl(var(--orange))/0.4]" />
            <div className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[hsl(var(--orange))/0.4]" />
            <div className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[hsl(var(--orange))/0.4]" />
          </div>
        </div>
      )}
    </div>
  )
}
