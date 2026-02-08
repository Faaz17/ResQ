"""
Webots Camera Streamer - WebSocket Server
==========================================
Streams your Webots camera feed to the browser dashboard via WebSocket.
"""

import asyncio
import base64
import io
import threading
import time
import PIL.Image

# --- Configuration ---
WS_PORT = 8765
JPEG_QUALITY = 70
STREAM_EVERY_N_STEPS = 2

# --- Internal State ---
_latest_frame_b64 = None
_clients = set()
_step_count = 0
_server_started = False


async def _ws_handler(websocket):
    """Handle new WebSocket connections."""
    _clients.add(websocket)
    try:
        print(f"📡 Dashboard connected! ({len(_clients)} client(s))")
        async for _ in websocket:
            pass  # keep connection alive, we don't expect messages
    except Exception:
        pass
    finally:
        _clients.discard(websocket)
        print(f"📡 Dashboard disconnected. ({len(_clients)} client(s))")


async def _broadcast_loop():
    """Continuously broadcast the latest frame to all connected clients."""
    global _latest_frame_b64
    last_sent = None
    while True:
        try:
            if _latest_frame_b64 and _latest_frame_b64 != last_sent and _clients:
                last_sent = _latest_frame_b64
                dead = set()
                for client in _clients.copy():
                    try:
                        await client.send(_latest_frame_b64)
                    except Exception:
                        dead.add(client)
                _clients.difference_update(dead)
        except Exception as e:
            print(f"⚠️ Broadcast error: {e}")
        await asyncio.sleep(0.05)


async def _run_server():
    """Start WebSocket server and broadcast loop."""
    try:
        import websockets
        from websockets.asyncio.server import serve
    except ImportError:
        try:
            import websockets
            serve = websockets.serve
        except ImportError:
            print("❌ 'websockets' not installed! Run: pip install websockets")
            return

    print(f"🌐 Starting camera stream on ws://localhost:{WS_PORT} ...")

    try:
        async with serve(_ws_handler, "0.0.0.0", WS_PORT) as server:
            print(f"✅ Camera stream server READY on ws://localhost:{WS_PORT}")
            await _broadcast_loop()
    except Exception as e:
        # Fallback for older websockets versions
        print(f"⚠️ Trying legacy websockets API... ({e})")
        try:
            server = await websockets.serve(_ws_handler, "0.0.0.0", WS_PORT)
            print(f"✅ Camera stream server READY on ws://localhost:{WS_PORT}")
            await _broadcast_loop()
        except Exception as e2:
            print(f"❌ WebSocket server failed to start: {e2}")


def _start_ws_thread():
    """Run the WebSocket server in a background thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_server())
    except Exception as e:
        print(f"❌ Camera stream thread error: {e}")


def start_streaming():
    """
    Call this once at the start of your controller.
    Starts the WebSocket server in a background thread.
    """
    global _server_started
    if _server_started:
        return
    _server_started = True

    ws_thread = threading.Thread(target=_start_ws_thread, daemon=True)
    ws_thread.start()
    print("🎥 Camera streamer initialized - waiting for server to start...")
    time.sleep(1)  # Give the server a moment to bind the port


def update_frame(camera):
    """
    Call this every timestep in your main loop.
    Captures the camera image and prepares it for streaming.
    """
    global _latest_frame_b64, _step_count

    _step_count += 1
    if _step_count % STREAM_EVERY_N_STEPS != 0:
        return

    if not _clients:
        return  # Don't waste CPU if nobody is watching

    try:
        image_data = camera.getImage()
        if not image_data:
            return

        width = camera.getWidth()
        height = camera.getHeight()

        # Webots returns BGRA format
        img = PIL.Image.frombytes('RGBA', (width, height), image_data)
        img = img.convert('RGB')

        # Encode as JPEG
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=JPEG_QUALITY)
        _latest_frame_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    except Exception as e:
        print(f"⚠️ Frame capture error: {e}")
