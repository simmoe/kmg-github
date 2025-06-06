from m5stack import *
from m5stack_ui import *
from uiflow import *
import urequests, ntptime, json, time
from libs.json_py import *
from m5mqtt import M5mqtt

# Screen setup
screen = M5Screen()
screen.clean_screen()
screen.set_screen_bg_color(0xFFFFFF)

# Global configuration
apikey = '2F3158FF'
hue_username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'

# night_lights: Array af objekter med lys-ID og den aktuelle "on"-status.
night_lights = [
    {"id": 8, "on": None},
    {"id": 9, "on": None},
    {"id": 10, "on": None},
    {"id": 11, "on": None},
    {"id": 12, "on": None},
    {"id": 13, "on": None},
    {"id": 14, "on": None},
]
# day_lights: Liste af lys-ID'er, som skal tændes i dag (skal være blandt night_lights)
day_lights = [9]

# Night mode settings
NIGHT_START = 16  # 24-timers format
NIGHT_END = 7
night_mode_suspend_until = 0

MQTT_SIGN_TOPIC = 'DDU_INFINITY'

# Opret labels
timeLabel = M5Label('Test time', x=30, y=53, color=0x000, font=FONT_MONT_14, parent=None)
nightModeLabel = M5Label('Updating night mode status...', x=30, y=73, color=0x000, font=FONT_MONT_14, parent=None)
updateLabel = M5Label('System started...', x=30, y=93, color=0x000, font=FONT_MONT_14, parent=None)
debugLabel = M5Label('Debug: OK', x=30, y=200, color=0x000, font=FONT_MONT_14, parent=None)

# Opret et dictionary til at holde checkbox references
checkboxes = {}

# Placer checkboxes i et grid med fire per række
start_x = 10
start_y = 120
offset_x = 80
offset_y = 30
for i, light in enumerate(night_lights):
    col = i % 4
    row = i // 4
    x = start_x + col * offset_x
    y = start_y + row * offset_y
    cb = M5Checkbox(text = 'B: ' + str(light["id"]),
                    x=x,
                    y=y,
                    text_c=0x000,
                    check_c=0x000,
                    font=FONT_MONT_18,
                    parent=None)


    cb.my_id = light["id"]  # Gem light number
    checkboxes[light["id"]] = cb

    # Callback for når checkboxen bliver sat til checked (antager on=True)
    def on_checkbox_checked(cb=cb):
        cmd = json.dumps({"light": cb.my_id, "on": True})
        log_update("Checkbox " + str(cb.my_id) + " changed to on")
        m5mqtt.publish('DEBUG/HUE_CONTROLLER_COMMAND', cmd, 0)
        fun_HUE_CONTROLLER_COMMAND_(cmd)

    # Callback for når checkboxen bliver sat til unchecked (antager on=False)
    def on_checkbox_unchecked(cb=cb):
        cmd = json.dumps({"light": cb.my_id, "on": False})
        log_update("Checkbox " + str(cb.my_id) + " changed to off")
        m5mqtt.publish('DEBUG/HUE_CONTROLLER_COMMAND', cmd, 0)
        fun_HUE_CONTROLLER_COMMAND_(cmd)

    cb.checked(on_checkbox_checked)
    cb.unchecked(on_checkbox_unchecked)

def log_update(msg):
    """Opdaterer updateLabel med en kort besked."""
    updateLabel.set_text(msg)

def update_debug_label(msg):
    debugLabel.set_text('Debug: ' + msg[:20])  # Limit to 20 characters to save space

def hue_request(method, path, json_data=None):
    """Central funktion til HTTP-kald til Hue API'et."""
    url = 'http://10.78.16.62/api/' + hue_username + '/' + path
    try:
        if method == 'GET':
            req = urequests.get(url)
        elif method == 'PUT':
            req = urequests.put(url, json=json_data)
        else:
            return None
        result = req.text
        req.close()
        return result
    except Exception as e:
        log_update("Hue request error: " + str(e))
        return None

def update_night_lights_state():
    """Opdaterer status for hvert lys i night_lights via et GET-kald til /lights."""
    res = hue_request('GET', 'lights')
    if res:
        try:
            lights = json.loads(res)
            for light in night_lights:
                lid_str = str(light["id"])
                if lid_str in lights:
                    light["on"] = lights[lid_str]["state"]["on"]
            log_update("night_lights updated")
            display_lights_status()
        except Exception as e:
            log_update("Error parsing lights: " + str(e))


def update_night_light_state(light_id, new_state):
    """Opdaterer tilstanden for et specifikt lys i night_lights."""
    for light in night_lights:
        if light["id"] == light_id:
            light["on"] = new_state
            break
    display_lights_status()

def display_lights_status():
    """
    Opdaterer checkboxene for hvert lys i night_lights.
    Hvis lys["on"] er True, sættes checkboksen til checked, ellers unchecked.
    """
    for light in night_lights:
        cb = checkboxes.get(light["id"])
        if cb:
            cb.set_checked(light["on"])


def update_night_lights_state_from_json(res):
    log_update("Updating lights from res")
    try:
        lights = json.loads(res)
        for light in night_lights:
            lid_str = str(light["id"])
            if lid_str in lights:
                light["on"] = lights[lid_str]["state"]["on"]
        log_update("night_lights updated")
        display_lights_status()
    except Exception as e:
        log_update("Error parsing lights: " + str(e))

def fun_UPDATE_LIGHTS(topic_data):
    update_night_lights_state_from_json(topic_data)


def fun_HUE_CONTROLLER_STATUS_REQUEST_(topic_data):
    """
    Handles status requests by fetching the current light states from the Hue API
    and publishing the result to the MQTT topic.
    """
    res = hue_request('GET', 'lights')
    if res:
        log_update("Status request begun")
        m5mqtt.publish('HUE_CONTROLLER/status', res, 0)
        # Removed redundant update of night lights
        log_update("Status request executed")
    else:
        m5mqtt.publish('HUE_CONTROLLER/status', "Error", 0)


def fun_HUE_CONTROLLER_COMMAND_(topic_data):
    try:
        log_update("Received command: " + topic_data)
        cmd = json.loads(topic_data)
        light_id = int(cmd.get('light', -1))

        xy_val = cmd.get('xy')
        if xy_val is not None:
            res = hue_request('PUT', 'lights/' + str(light_id) + '/state', {'xy': xy_val})
            if res is not None:
                m5mqtt.publish('HUE_CONTROLLER/status', res, 0)
                log_update("Light " + str(light_id) + " set to " + str(xy_val))
            else:
                m5mqtt.publish('HUE_CONTROLLER/status', json.dumps({"error": "Hue API request failed"}), 0)
            return

        on_val = cmd.get('on')
        if on_val is not None:
            res = hue_request('PUT', 'lights/' + str(light_id) + '/state', {'on': bool(on_val)})
            if res is not None:
                m5mqtt.publish('HUE_CONTROLLER/status', res, 0)
                update_night_light_state(light_id, bool(on_val))
                log_update("Light " + str(light_id) + " set to " + ("on" if on_val else "off"))
            else:
                m5mqtt.publish('HUE_CONTROLLER/status', json.dumps({"error": "Hue API request failed"}), 0)
            return

        m5mqtt.publish('HUE_CONTROLLER/status', json.dumps({"error": "Unknown command"}), 0)
    except Exception as e:
        m5mqtt.publish('HUE_CONTROLLER/status', json.dumps({"error": str(e)}), 0)
        log_update("Error in COMMAND: " + str(e))

def fun_NIGHT_MODE_OVERRIDE_(topic_data):
    global night_mode_suspend_until
    night_mode_suspend_until = time.time() + 6 * 3600
    m5mqtt.publish(MQTT_SIGN_TOPIC, 'on', 0)
    nightModeLabel.set_text("Night mode override active - disabled")
    log_update("Night mode override activated")

def check_night_mode():
    try:
        if time.time() < night_mode_suspend_until:
            m5mqtt.publish(MQTT_SIGN_TOPIC, 'on', 0)
            nightModeLabel.set_text("Night mode override active")
            log_update("Night mode override active")
            return

        current_hour = ntp.hour()
        if current_hour >= NIGHT_START or current_hour < NIGHT_END:
            # Night mode: Sluk hvert lys i night_lights
            for light in night_lights:
                hue_request('PUT', 'lights/' + str(light["id"]) + '/state', {'on': False})
                light["on"] = False
            m5mqtt.publish(MQTT_SIGN_TOPIC, 'off', 0)
            nightModeLabel.set_text("Night mode active")
            timeLabel.set_text(ntp.formatTime(':'))
            log_update("Night mode: lights turned off")
            display_lights_status()
        else:
            # Day mode: Tænd de lys i day_lights (som findes i night_lights)
            for lid in day_lights:
                hue_request('PUT', 'lights/' + str(lid) + '/state', {'on': True})
                update_night_light_state(lid, True)
            m5mqtt.publish(MQTT_SIGN_TOPIC, 'on', 0)
            nightModeLabel.set_text("Day mode active")
            log_update("Day mode: lights turned on")
            display_lights_status()
    except Exception as e:
        log_update("Error in night mode: " + str(e))

def fun_DDU_TIME(topic_data):
    """
    Modtager et tidspunkt (fx "14:00"), beregner blinketallet (i 12-timers format),
    benytter gruppe 81's endpoint til at blinke, og gendanner derefter lysenes oprindelige tilstand
    baseret på data i night_lights.
    """
    try:
        # Brug den interne tilstand i night_lights (ingen ekstra opdatering)
        orig_states = {light["id"]: light["on"] for light in night_lights}
        
        time_str = topic_data.strip()  # fx "14:00"
        hour_int = int(time_str.split(':')[0])
        blink_count = hour_int % 12
        if blink_count == 0:
            blink_count = 12
        
        log_update("Blinking group 81 " + str(blink_count) + " times")
        group_endpoint = 'groups/81/action'
        for i in range(blink_count):
            hue_request('PUT', group_endpoint, {'on': True})
            timerSch.run_once(lambda: hue_request('PUT', group_endpoint, {'on': False}), 1000)  # 1-second delay
        
        # Gendan lysenes tilstand baseret på den oprindelige værdi
        for light in night_lights:
            hue_request('PUT', 'lights/' + str(light["id"]) + '/state', {'on': orig_states[light["id"]]})
            light["on"] = orig_states[light["id"]]
        log_update("Blinking complete, states restored")
        display_lights_status()
    except Exception:
        pass  # Prevent crashes in case of errors

# Add a global variable to track the last time the NTP server was checked
last_ntp_check = 0
NTP_CHECK_INTERVAL = 3600  # Check NTP server every hour (in seconds)

def check_ntp_connection():
    """
    Checks and reconnects to the NTP server if necessary.
    Ensures the controller has an accurate time source.
    """
    global ntp, last_ntp_check
    current_time = time.time()
    if current_time - last_ntp_check > NTP_CHECK_INTERVAL:
        try:
            update_debug_label('NTP reconnecting')
            ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
            last_ntp_check = current_time
            update_debug_label('NTP reconnected')
        except Exception as e:
            update_debug_label('NTP error: ' + str(e)[:15])

# Ensure MQTT reconnection logic is robust
def ensure_mqtt_connection():
    try:
        if not m5mqtt.is_connected():
            update_debug_label('MQTT reconnecting')
            m5mqtt.start()
            update_debug_label('MQTT reconnected')
    except Exception as e:
        update_debug_label('MQTT error: ' + str(e)[:15])

# Temporarily disable the watchdog timer to debug restarts
# from machine import WDT

# Commenting out the watchdog initialization for debugging
# wdt = WDT(timeout=10000)

# Ensure the watchdog timer is fed periodically in the ntpTimer function
@timerSch.event('ntpTimer')
def tntpTimer():
    try:
        update_debug_label('Timer running')
        # Temporarily disable watchdog feeding for debugging
        # wdt.feed()
        ensure_mqtt_connection()
        update_debug_label('MQTT checked')
        check_ntp_connection()
        update_debug_label('NTP checked')
        check_night_mode()
        update_debug_label('Night mode checked')
    except Exception as e:
        update_debug_label('Error: ' + str(e)[:15])  # Show a short error message

# MQTT initialization
m5mqtt = M5mqtt('', 'mqtt.nextservices.dk', 0, '', '', 300, ssl=True)
m5mqtt.subscribe('HUE_CONTROLLER_STATUS_REQUEST', fun_HUE_CONTROLLER_STATUS_REQUEST_)
m5mqtt.subscribe('HUE_CONTROLLER_COMMAND', fun_HUE_CONTROLLER_COMMAND_)
m5mqtt.subscribe('NIGHT_MODE_OVERRIDE', fun_NIGHT_MODE_OVERRIDE_)
m5mqtt.subscribe('DDU_TIME', fun_DDU_TIME)
m5mqtt.subscribe('UPDATE_LIGHTS', fun_UPDATE_LIGHTS)

m5mqtt.start()
m5mqtt.publish('KMG CONTROLLER STARTUP', 'Start', 0)

# Initialize the last_ntp_check variable during startup
last_ntp_check = time.time()
ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
check_night_mode()
timerSch.run('ntpTimer', 360000, 0)  # Run every 6 minutes (360000 ms)
