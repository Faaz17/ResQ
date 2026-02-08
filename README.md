# ResQ-Agent — Mission Control Dashboard

> A real-time rescue robot mission control system integrating a **Webots** simulated Pioneer 3-DX robot with a **Next.js** dashboard. The robot autonomously patrols an environment, avoids obstacles using 8 sonar sensors, and uses **Google Gemini AI** (Vision Language Model) to detect human victims via its onboard camera. The live camera feed and AI detection status are streamed to the browser dashboard over WebSocket.

![Stack](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs) ![React](https://img.shields.io/badge/React-19-blue?logo=react) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss) ![Python](https://img.shields.io/badge/Python-3.11+-3776ab?logo=python) ![Webots](https://img.shields.io/badge/Webots-R2025a-red) ![Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285f4?logo=google)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [How It Works](#how-it-works)
  - [Robot Controller](#robot-controller)
  - [Camera Streaming](#camera-streaming)
  - [AI Victim Detection](#ai-victim-detection)
  - [Dashboard Frontend](#dashboard-frontend)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The ResQ-Agent system consists of two main components:

1. **Webots Robot Controller** (Python) — Controls a Pioneer 3-DX robot in a simulated disaster environment. The robot autonomously patrols, avoids obstacles, and uses Google Gemini AI to analyze its camera feed for human victims.

2. **Mission Control Dashboard** (Next.js/React) — A real-time browser-based dashboard that displays the live camera feed from the robot, AI detection status, telemetry data, incident logs, and control panel.

The two components communicate via **WebSocket** — the robot controller runs a WebSocket server that streams camera frames and AI status as JSON messages to the dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WEBOTS SIMULATION                     │
│                                                         │
│  ┌─────────────────────┐    ┌────────────────────────┐  │
│  │  resq_controller.py │    │   camera_streamer.py   │  │
│  │                     │───▶│                        │  │
│  │  • Motor control    │    │  • WebSocket server    │  │
│  │  • 8 sonar sensors  │    │    (ws://localhost:8765)│  │
│  │  • Gemini AI calls  │    │  • JPEG frame encoding │  │
│  │  • State machine    │    │  • JSON broadcast      │  │
│  │  • Obstacle avoid   │    │  • AI status relay     │  │
│  └─────────────────────┘    └──────────┬─────────────┘  │
│                                        │                │
└────────────────────────────────────────┼────────────────┘
                                         │ WebSocket
                                         │ (JSON: frame + AI status)
                                         ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS DASHBOARD (Browser)                 │
│                                                         │
│  ┌──────────────────┐  ┌─────────────────────────────┐  │
│  │ use-webots-camera │  │    primary-viewport.tsx     │  │
│  │   (React Hook)    │─▶│                             │  │
│  │                   │  │  • Live camera feed         │  │
│  │  • WS connection  │  │  • Bounding box on detect   │  │
│  │  • Auto-reconnect │  │  • VLM status banner        │  │
│  │  • FPS tracking   │  │  • HUD overlay              │  │
│  │  • JSON parsing   │  └─────────────────────────────┘  │
│  └──────────────────┘                                    │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │mission-header│ │telemetry-grid│ │  incident-log   │  │
│  │              │ │              │ │                  │  │
│  │• Mission time│ │• Battery     │ │• Event timeline  │  │
│  │• Status      │ │• Signal      │ │• Hazard status   │  │
│  │• Env hazard  │ │• Coordinates │ │• Victim reports  │  │
│  │• Threat level│ │• Proximity   │ │                  │  │
│  └──────────────┘ └──────────────┘ └─────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                  control-panel.tsx                   │ │
│  │  [E-STOP] [Deploy Rescue Signal] [VLM Auto: ON]    │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### Robot Controller
- **Autonomous patrol** with random wander for environment exploration
- **8-sensor obstacle avoidance** using Pioneer 3-DX sonar array (so0–so7)
- **4-state navigation machine**: `PATROL` → `AVOID` → `REVERSE` → `SPIN`
- **Google Gemini AI** victim detection via camera snapshots
- **Exponential backoff** for API rate limiting (60s → 120s → 240s → 600s cap)
- **Live camera streaming** via WebSocket at ~20 FPS

### Mission Control Dashboard
- **Live camera viewport** with real-time Webots feed
- **AI detection overlay** — red bounding box + pulsing border when victim detected
- **VLM status banner** — real-time status (scanning / detected / cooldown)
- **Telemetry grid** — battery, signal strength, coordinates, obstacle proximity
- **Incident log** — timestamped event timeline with severity levels
- **Control panel** — Emergency Stop, Rescue Signal, VLM Auto toggle
- **Mission header** — elapsed time, operational status, environmental hazard level
- **Dark theme** with military/mission-control aesthetic
- **Auto-reconnecting WebSocket** with connection status indicator

---

## Project Structure

```
project/
│
├── 📁 Dashboard (Next.js)
│   └── v0-mission-control-dashboard-main/
│       ├── app/
│       │   ├── layout.tsx              # Root layout with theme provider
│       │   ├── page.tsx                # Entry point → MissionDashboard
│       │   └── globals.css             # Global styles
│       ├── components/
│       │   └── dashboard/
│       │       ├── mission-dashboard.tsx  # Main layout composition
│       │       ├── mission-header.tsx     # Top bar: clock, status, hazards
│       │       ├── primary-viewport.tsx   # Camera feed + AI overlays
│       │       ├── telemetry-grid.tsx     # 4-card telemetry display
│       │       ├── incident-log.tsx       # Left sidebar event timeline
│       │       └── control-panel.tsx      # Bottom action buttons
│       ├── hooks/
│       │   └── use-webots-camera.ts      # WebSocket hook for camera stream
│       ├── package.json
│       └── tailwind.config.ts
│
├── 📁 Robot Controller (Python/Webots)
│   └── controllers/resq_controller/
│       ├── resq_controller.py     # Main robot controller
│       ├── camera_streamer.py     # WebSocket server for camera stream
│       └── rescue_view.jpg        # Temporary AI analysis snapshot
```

---

## Prerequisites

| Component | Requirement |
|-----------|------------|
| **Webots** | R2025a or later |
| **Python** | 3.11+ (bundled with Webots or system-installed) |
| **Node.js** | v18+ (v24 tested) |
| **npm** | v9+ |
| **Google AI API Key** | [Get one at aistudio.google.com](https://aistudio.google.com/apikey) |

### Python packages (for the robot controller):
```
google-genai
Pillow
websockets
```

### Node.js packages (auto-installed via npm):
```
next, react, tailwindcss, lucide-react, recharts, radix-ui, etc.
```

---

## Installation

### 1. Clone / Download the project

Place the dashboard folder and the Webots controller in their respective locations.

### 2. Install Python dependencies

Open a terminal and run:

```bash
pip install google-genai Pillow websockets
```

### 3. Install Dashboard dependencies

```bash
cd v0-mission-control-dashboard-main
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required due to a peer dependency conflict between `date-fns` v4 and `react-day-picker`.

### 4. Set your Gemini API Key

Open `controllers/resq_controller/resq_controller.py` and paste your API key:

```python
API_KEY = "YOUR_GOOGLE_GEMINI_API_KEY_HERE"
```

You can get a free API key at [Google AI Studio](https://aistudio.google.com/apikey).

### 5. Set up Webots

- Open your Webots world file (e.g., `factory.wbt`)
- Ensure the Pioneer 3-DX robot's controller is set to `resq_controller`
- Ensure the controller folder contains both `resq_controller.py` and `camera_streamer.py`

---

## Running the Project

### Step 1: Start the Dashboard

```bash
cd v0-mission-control-dashboard-main
npm run dev
```

The dashboard will be available at **http://localhost:3000**

### Step 2: Start the Webots Simulation

1. Open the Webots world file
2. Click **Play** ▶️ (or Reset → Play if restarting)
3. The Webots console should show:

```
🔍 Scanning for available AI models...
✅ FOUND WORKING MODEL: models/gemini-2.5-flash
🎥 Camera streamer initialized - waiting for server to start...
✅ Camera stream server READY on ws://localhost:8765
🤖 ResQ Agent Patrol Started...
📡 Dashboard connected! (1 client(s))
```

### Step 3: View the Dashboard

Open **http://localhost:3000** in your browser. You should see:
- Live camera feed from the robot
- "LIVE" indicator in green
- FPS counter
- VLM status: "Gemini AI Active — Scanning for victims..."

---

## How It Works

### Robot Controller

**File:** `resq_controller.py`

The controller uses a **4-state navigation machine**:

| State | Behavior | Transition |
|-------|----------|------------|
| `PATROL` | Drive forward with random wander. Veer away from side obstacles. | → `AVOID` when front obstacle detected |
| `AVOID` | Turn toward the clearer side. Sharp turn if obstacle is very close. | → `PATROL` if front clears, → `REVERSE` if stuck too long |
| `REVERSE` | Drive backward for 25 steps. | → `SPIN` after reversing |
| `SPIN` | Rotate in place to find a clear path. Alternates direction after each retry. | → `PATROL` if clear, force patrol after 3 retries |

**Sensor mapping** (Pioneer 3-DX sonar array):
- `so0`, `so1` — Left side
- `so2`, `so3` — Front-left
- `so4`, `so5` — Front-right
- `so6`, `so7` — Right side
- Values: `0` = clear, `>80` = obstacle, `>300` = very close

### Camera Streaming

**File:** `camera_streamer.py`

The camera streamer runs a **WebSocket server** on `ws://localhost:8765` in a background thread. Every 2 simulation steps, it:

1. Captures the camera's raw BGRA image
2. Converts it to RGB using Pillow
3. Encodes as JPEG (70% quality)
4. Base64-encodes the JPEG
5. Broadcasts a JSON message to all connected clients:

```json
{
  "frame": "<base64 JPEG data>",
  "victim": false,
  "ai_status": "scanning",
  "ai_response": ""
}
```

When the AI detects a victim, the status changes to:

```json
{
  "frame": "<base64 JPEG data>",
  "victim": true,
  "ai_status": "detected",
  "ai_response": "YES, there is a human figure visible..."
}
```

### AI Victim Detection

The robot periodically (every ~8 seconds / 120 steps):

1. Saves a camera snapshot as `rescue_view.jpg`
2. Opens and resizes the image to 1024×1024
3. Sends it to **Google Gemini 2.5 Flash** with the prompt:
   > "You are a rescue robot's vision system. Is there ANY person or human figure visible ANYWHERE in the image? Answer with ONLY 'YES' or 'NO', then a brief reason."
4. If the response contains "YES" → robot stops, dashboard shows detection alert
5. On API rate limit (429) → exponential backoff (60s → 120s → 240s → 600s max)

### Dashboard Frontend

**File:** `primary-viewport.tsx`

The dashboard uses the `useWebotsCamera` React hook to maintain a WebSocket connection. The hook:

- Parses incoming JSON messages for `frame`, `victim`, `ai_status`
- Auto-reconnects every 2 seconds on disconnect
- Tracks FPS

The viewport displays:
- **Normal mode:** Live feed + orange crosshair + "Scanning for victims..." banner
- **Victim detected:** Red pulsing border + bounding box + "🚨 VICTIM DETECTED" overlay + green VLM banner
- **API cooldown:** Yellow "⏳ API cooldown" banner
- **Disconnected:** "WAITING FOR WEBOTS FEED..." fallback screen

---

## Configuration

### Robot Controller (`resq_controller.py`)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | — | Google Gemini API key |
| `TIME_STEP` | `64` | Webots simulation timestep (ms) |
| `MAX_SPEED` | `6.28` | Max wheel velocity (rad/s) |
| `API_CALL_INTERVAL` | `120` | Steps between AI calls (~8 seconds) |
| `OBSTACLE_THRESHOLD` | `80` | Sonar value above which = obstacle |
| `CLOSE_THRESHOLD` | `300` | Sonar value for "very close" obstacle |
| `PATROL_SPEED` | `0.5` | Speed multiplier during patrol (0–1) |

### Camera Streamer (`camera_streamer.py`)

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_PORT` | `8765` | WebSocket server port |
| `JPEG_QUALITY` | `70` | JPEG compression quality (1–100) |
| `STREAM_EVERY_N_STEPS` | `2` | Send frame every N timesteps |

### Dashboard Hook (`use-webots-camera.ts`)

| Option | Default | Description |
|--------|---------|-------------|
| `url` | `ws://localhost:8765` | WebSocket server URL |
| `reconnectDelay` | `2000` | Reconnect interval (ms) |

---

## Troubleshooting

### Camera feed not showing ("OFFLINE")
- Ensure Webots simulation is **running** (Play button pressed)
- Check the Webots console for `✅ Camera stream server READY`
- Restart the simulation: Stop → Reset → Play
- Ensure `camera_streamer.py` is in the same folder as `resq_controller.py`

### "Rate limited! Cooling down for 60s..."
- Your Gemini API free tier quota is exhausted
- The daily quota resets at **midnight Pacific Time**
- You can create a new API key with a different Google account
- The robot continues patrolling and will retry automatically

### Robot stuck / spinning endlessly
- The sensor thresholds may need tuning for your specific Webots world
- Increase `SPIN_DURATION` or decrease `OBSTACLE_THRESHOLD`
- Check the `📡 Sensors: [...]` debug output in the Webots console

### `npm install` fails with ERESOLVE
- Use `npm install --legacy-peer-deps`

### `FutureWarning: google.generativeai deprecated`
- This warning can be safely ignored, or ensure `google-genai` (new package) is installed
- The controller uses `from google import genai` (new SDK)

### WebSocket connection refused
- Make sure the Webots simulation is started **before** or **alongside** the dashboard
- Ensure port `8765` is not blocked by a firewall
- The dashboard auto-reconnects every 2 seconds

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Simulation** | Webots R2025a |
| **Robot** | Pioneer 3-DX (differential drive, 8 sonar, camera) |
| **Controller** | Python 3.11+ |
| **AI Model** | Google Gemini 2.5 Flash (VLM) |
| **Streaming** | WebSocket (Python `websockets` library) |
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 3, custom dark theme |
| **UI Components** | Radix UI, Lucide React icons, shadcn/ui |
| **Charts** | Recharts |

---

## License

This project was built for the **HWT Hackathon** rescue robotics challenge.

