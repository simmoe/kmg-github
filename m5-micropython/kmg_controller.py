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

def fun_HUE_CONTROLLER_STATUS_REQUEST_(topic_data):
    res = hue_request('GET', 'lights')
    if res:
        m5mqtt.publish('HUE_CONTROLLER/status', res, 0)
        update_night_lights_state()
        log_update("Status request executed")
    else:
        m5mqtt.publish('HUE_CONTROLLER/status', "Error", 0)

def fun_HUE_CONTROLLER_COMMAND_(topic_data):
    try:
        log_update("Received command: " + topic_data)
        cmd = json.loads(topic_data)
        on_val = True if get_json_key(cmd, 'on') else False
        light_id = int(get_json_key(cmd, 'light'))
        res = hue_request('PUT', 'lights/' + str(light_id) + '/state', {'on': on_val})
        if res is not None:
            m5mqtt.publish('HUE_CONTROLLER/status', res, 0)
            update_night_light_state(light_id, on_val)
            log_update("Light " + str(light_id) + " set to " + ("on" if on_val else "off"))
        else:
            m5mqtt.publish('HUE_CONTROLLER/status', "Error", 0)
    except Exception as e:
        m5mqtt.publish('HUE_CONTROLLER/status', str(e), 0)
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
            time.sleep(1)
            hue_request('PUT', group_endpoint, {'on': False})
            time.sleep(1)
        
        # Gendan lysenes tilstand baseret på den oprindelige værdi
        for light in night_lights:
            hue_request('PUT', 'lights/' + str(light["id"]) + '/state', {'on': orig_states[light["id"]]})
            light["on"] = orig_states[light["id"]]
        log_update("Blinking complete, states restored")
        display_lights_status()
    except Exception as e:
        log_update("Error in DDU_TIME: " + str(e))

@timerSch.event('ntpTimer')
def tntpTimer():
    global ntp
    ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
    check_night_mode()

# MQTT initialization
m5mqtt = M5mqtt('', 'mqtt.nextservices.dk', 0, '', '', 300, ssl=True)
m5mqtt.subscribe('HUE_CONTROLLER_STATUS_REQUEST', fun_HUE_CONTROLLER_STATUS_REQUEST_)
m5mqtt.subscribe('HUE_CONTROLLER_COMMAND', fun_HUE_CONTROLLER_COMMAND_)
m5mqtt.subscribe('NIGHT_MODE_OVERRIDE', fun_NIGHT_MODE_OVERRIDE_)
m5mqtt.subscribe('DDU_TIME', fun_DDU_TIME)
m5mqtt.start()
m5mqtt.publish('KMG CONTROLLER STARTUP', 'Start', 0)

ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
check_night_mode()
timerSch.run('ntpTimer', 360000, 0)
