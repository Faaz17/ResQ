from controller import Robot, Camera, Motor
import os
import time as pytime
import random
from google import genai
from google.genai import types
import PIL.Image
from camera_streamer import start_streaming, update_frame, set_ai_status

# --- CONFIGURATION ---
TIME_STEP = 64
MAX_SPEED = 6.28
IMAGE_PATH = "rescue_view.jpg"

# --- API KEY (loaded from api_key.txt so it's never committed to git) ---
_key_file = os.path.join(os.path.dirname(__file__), "api_key.txt")
if os.path.exists(_key_file):
    API_KEY = open(_key_file).read().strip()
    print(f"🔑 API key loaded from api_key.txt")
else:
    API_KEY = ""
    print(f"⚠️ No api_key.txt found! Create it in: {_key_file}")

# --- AI SETUP (new google.genai SDK) ---
AI_AVAILABLE = False
client = None

try:
    client = genai.Client(api_key=API_KEY)
    
    print("🔍 Scanning for available AI models...")
    chosen_model = None
    for m in client.models.list():
        name = m.name
        if "flash" in name and "gemini" in name:
            chosen_model = name
            break
    
    if not chosen_model:
        for m in client.models.list():
            name = m.name
            if "gemini" in name:
                chosen_model = name
                break
    
    if chosen_model:
        print(f"✅ FOUND WORKING MODEL: {chosen_model}")
        AI_AVAILABLE = True
    else:
        print("❌ NO MODELS FOUND.")
        
except Exception as e:
    print(f"⚠️ AI Setup Error: {e}")

# --- ROBOT SETUP ---
robot = Robot()

left_motor = robot.getDevice('left wheel')
right_motor = robot.getDevice('right wheel')
left_motor.setPosition(float('inf'))
right_motor.setPosition(float('inf'))
left_motor.setVelocity(0.0)
right_motor.setVelocity(0.0)

camera = robot.getDevice('camera')
camera.enable(TIME_STEP)

ds = []
ds_names = ['so0', 'so1', 'so2', 'so3', 'so4', 'so5', 'so6', 'so7']
for name in ds_names:
    sensor = robot.getDevice(name)
    sensor.enable(TIME_STEP)
    ds.append(sensor)

# --- API RATE LIMITING (Exponential Backoff) ---
api_cooldown_until = 0
api_backoff = 60
MAX_BACKOFF = 600
API_CALL_INTERVAL = 120
api_consecutive_fails = 0

def analyze_image():
    """Analyze the saved camera image using Gemini AI."""
    global api_cooldown_until, api_backoff, api_consecutive_fails
    
    if not AI_AVAILABLE or not client:
        return False
    
    current_time = pytime.time()
    if current_time < api_cooldown_until:
        wait_remaining = int(api_cooldown_until - current_time)
        if wait_remaining % 15 == 0:
            print(f"⏳ API cooldown: {wait_remaining}s remaining...")
        set_ai_status("cooldown")
        return False
    
    print("📸 Analyzing scene...")
    set_ai_status("scanning")
    
    try:
        if not os.path.exists(IMAGE_PATH):
            print("  ❌ No image file found")
            return False
        
        img = PIL.Image.open(IMAGE_PATH)
        img.thumbnail((1024, 1024))
        
        prompt = (
            "You are a rescue robot's vision system. "
            "Look carefully at this image. "
            "Is there ANY person or human figure visible ANYWHERE in the image? "
            "This includes standing, sitting, lying down, partially hidden, or far away. "
            "Even a small figure of a person counts. "
            "Answer with ONLY 'YES' or 'NO', then a brief reason."
        )
        
        response = client.models.generate_content(
            model=chosen_model,
            contents=[prompt, img]
        )
        
        if not response.text:
            print("  ⚠️ Empty response from AI")
            set_ai_status("scanning")
            return False
        
        text = response.text.strip()
        print(f"🤖 AI Full Response: {text}")
        result = text.upper()
        
        # Reset backoff on success
        api_backoff = 60
        api_consecutive_fails = 0
        
        if "YES" in result:
            set_ai_status("detected", victim=True, response=text)
            return True
        else:
            set_ai_status("scanning", victim=False, response=text)
            return False
        
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
            api_consecutive_fails += 1
            api_backoff = min(api_backoff * 2, MAX_BACKOFF)
            api_cooldown_until = pytime.time() + api_backoff
            print(f"⚠️ Rate limited! Backing off for {api_backoff}s (attempt #{api_consecutive_fails})")
            set_ai_status("cooldown")
            if api_consecutive_fails >= 3:
                print(f"   💡 Your daily API quota may be exhausted.")
        else:
            print(f"  Analysis Error: {e}")
            set_ai_status("scanning")
        return False

# =============================================
# SENSOR THRESHOLDS
# =============================================
OBSTACLE_THRESHOLD = 80
CLOSE_THRESHOLD = 300

# =============================================
# NAVIGATION STATE MACHINE
# =============================================
STATE_PATROL = 0
STATE_AVOID = 1
STATE_REVERSE = 2
STATE_SPIN = 3

state = STATE_PATROL
state_timer = 0
avoid_counter = 0
spin_direction = 1
patrol_speed = 0.5
spin_retry_count = 0

AVOID_STUCK_LIMIT = 50
REVERSE_DURATION = 25
SPIN_DURATION = 30

def has_obstacle(value):
    return value > OBSTACLE_THRESHOLD

def is_close(value):
    return value > CLOSE_THRESHOLD

# --- START CAMERA STREAM ---
start_streaming()

# Tell the dashboard we're alive
set_ai_status("scanning")

# --- MAIN LOOP ---
print("🤖 ResQ Agent Patrol Started...")
step_counter = 0
victim_found = False

while robot.step(TIME_STEP) != -1:
    
    if victim_found:
        left_motor.setVelocity(0)
        right_motor.setVelocity(0)
        update_frame(camera)  # Keep streaming even when stopped
        continue

    step_counter += 1
    update_frame(camera)
    
    # --- AI ANALYSIS (periodic) ---
    if step_counter % API_CALL_INTERVAL == 0:
        camera.saveImage(IMAGE_PATH, 100)
        if analyze_image():
            print("=" * 50)
            print("🚨🚨🚨 VICTIM LOCATED! STOPPING ROBOT! 🚨🚨🚨")
            print("=" * 50)
            victim_found = True
            set_ai_status("detected", victim=True, response="VICTIM CONFIRMED - Robot stopped")
            continue

    # --- READ SENSORS ---
    sv = [ds[i].getValue() for i in range(8)]
    
    if step_counter % 500 == 0:
        readable = ', '.join(f'{v:.0f}' for v in sv)
        state_name = ['PATROL', 'AVOID', 'REVERSE', 'SPIN'][state]
        print(f"📡 Sensors: [{readable}]  State: {state_name}  Step: {step_counter}")
    
    obstacle_left = has_obstacle(sv[0]) or has_obstacle(sv[1])
    obstacle_front_left = has_obstacle(sv[2]) or has_obstacle(sv[3])
    obstacle_front_right = has_obstacle(sv[4]) or has_obstacle(sv[5])
    obstacle_right = has_obstacle(sv[6]) or has_obstacle(sv[7])
    obstacle_front = obstacle_front_left or obstacle_front_right
    
    close_front = is_close(sv[2]) or is_close(sv[3]) or is_close(sv[4]) or is_close(sv[5])
    
    left_blocked = sv[0] + sv[1] + sv[2] + sv[3]
    right_blocked = sv[4] + sv[5] + sv[6] + sv[7]
    
    front_all_clear = not obstacle_front

    # =============================================
    # STATE MACHINE
    # =============================================
    
    if state == STATE_PATROL:
        if front_all_clear and not close_front:
            wander = random.uniform(-0.05, 0.05)
            left_speed = MAX_SPEED * (patrol_speed + wander)
            right_speed = MAX_SPEED * (patrol_speed - wander)
            avoid_counter = 0
        elif obstacle_front or close_front:
            state = STATE_AVOID
            avoid_counter = 0
            spin_direction = -1 if left_blocked < right_blocked else 1
            continue
        elif obstacle_left and not obstacle_right:
            left_speed = MAX_SPEED * 0.5
            right_speed = MAX_SPEED * 0.3
        elif obstacle_right and not obstacle_left:
            left_speed = MAX_SPEED * 0.3
            right_speed = MAX_SPEED * 0.5
        else:
            left_speed = MAX_SPEED * patrol_speed
            right_speed = MAX_SPEED * patrol_speed
        
        left_motor.setVelocity(left_speed)
        right_motor.setVelocity(right_speed)
    
    elif state == STATE_AVOID:
        avoid_counter += 1
        
        if avoid_counter > AVOID_STUCK_LIMIT:
            print("🚧 Stuck! Reversing...")
            state = STATE_REVERSE
            state_timer = REVERSE_DURATION
            spin_direction = random.choice([-1, 1])
            continue
        
        if front_all_clear and not close_front:
            state = STATE_PATROL
            avoid_counter = 0
            continue
        
        if close_front:
            turn_speed = MAX_SPEED * 0.5
            if spin_direction == 1:
                left_speed = turn_speed
                right_speed = -turn_speed
            else:
                left_speed = -turn_speed
                right_speed = turn_speed
        else:
            if spin_direction == 1:
                left_speed = MAX_SPEED * 0.4
                right_speed = -MAX_SPEED * 0.1
            else:
                left_speed = -MAX_SPEED * 0.1
                right_speed = MAX_SPEED * 0.4
        
        left_motor.setVelocity(left_speed)
        right_motor.setVelocity(right_speed)
    
    elif state == STATE_REVERSE:
        state_timer -= 1
        left_motor.setVelocity(-MAX_SPEED * 0.4)
        right_motor.setVelocity(-MAX_SPEED * 0.4)
        
        if state_timer <= 0:
            print(f"🔄 Reversing done, spinning {'left' if spin_direction == -1 else 'right'}...")
            state = STATE_SPIN
            state_timer = SPIN_DURATION + random.randint(0, 20)
            spin_retry_count = 0
    
    elif state == STATE_SPIN:
        state_timer -= 1
        
        spin_speed = MAX_SPEED * 0.5
        if spin_direction == 1:
            left_motor.setVelocity(spin_speed)
            right_motor.setVelocity(-spin_speed)
        else:
            left_motor.setVelocity(-spin_speed)
            right_motor.setVelocity(spin_speed)
        
        if state_timer <= 0:
            if front_all_clear and not close_front:
                print("✅ Path clear, resuming patrol!")
                state = STATE_PATROL
                avoid_counter = 0
                spin_retry_count = 0
            else:
                spin_retry_count += 1
                if spin_retry_count > 3:
                    print("⚡ Forcing patrol to escape spin loop!")
                    state = STATE_PATROL
                    avoid_counter = 0
                    spin_retry_count = 0
                else:
                    spin_direction *= -1
                    state_timer = SPIN_DURATION + random.randint(0, 15)
                    print(f"🔄 Still blocked, trying other direction... (retry {spin_retry_count}/3)")
