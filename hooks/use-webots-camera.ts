"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseWebotsCameraOptions {
  url?: string
  reconnectDelay?: number
}

interface UseWebotsCameraReturn {
  frame: string | null
  connected: boolean
  fps: number
  victimDetected: boolean
  aiStatus: string
  aiResponse: string
}

export function useWebotsCamera({
  url = "ws://localhost:8765",
  reconnectDelay = 2000,
}: UseWebotsCameraOptions = {}): UseWebotsCameraReturn {
  const [frame, setFrame] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [fps, setFps] = useState(0)
  const [victimDetected, setVictimDetected] = useState(false)
  const [aiStatus, setAiStatus] = useState("idle")
  const [aiResponse, setAiResponse] = useState("")

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameCountRef = useRef(0)
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setConnected(true)
        console.log("[WebotsCamera] Connected to", url)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        frameCountRef.current++

        try {
          // Try to parse as JSON (new format with AI status)
          const data = JSON.parse(event.data)
          if (data.frame) {
            setFrame(`data:image/jpeg;base64,${data.frame}`)
          }
          if (data.victim !== undefined) {
            setVictimDetected(data.victim)
          }
          if (data.ai_status) {
            setAiStatus(data.ai_status)
          }
          if (data.ai_response !== undefined) {
            setAiResponse(data.ai_response)
          }
        } catch {
          // Fallback: raw base64 string (old format)
          setFrame(`data:image/jpeg;base64,${event.data}`)
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        console.log("[WebotsCamera] Disconnected, reconnecting...")
        reconnectTimerRef.current = setTimeout(connect, reconnectDelay)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      if (mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, reconnectDelay)
      }
    }
  }, [url, reconnectDelay])

  useEffect(() => {
    mountedRef.current = true
    connect()

    // FPS counter
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current)
      frameCountRef.current = 0
    }, 1000)

    return () => {
      mountedRef.current = false
      wsRef.current?.close()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current)
    }
  }, [connect])

  return { frame, connected, fps, victimDetected, aiStatus, aiResponse }
}
