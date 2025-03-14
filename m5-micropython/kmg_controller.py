from m5stack import *
from m5stack_ui import *
from uiflow import *
import urequests
import ntptime
import json
import time
from libs.json_py import *
from m5mqtt import M5mqtt

# Skærmopsætning
screen = M5Screen()
screen.clean_screen()
screen.set_screen_bg_color(0xFFFFFF)

# Globale variabler
json_object = None
apikey = None
hue_username = None
onBoolean = None

# Lys der skal slukkes om natten
night_lights = [8, 9, 10, 11, 12, 13, 14]
# Lys der skal tændes automatisk om dagen
day_lights = [9]

# Globale tidspunkter for nattilstand (24-timers format)
NIGHT_START = 16  # Nat starter kl. 16:00
NIGHT_END = 7     # Nat slutter kl. 07:00

# Global variabel for midlertidig udsættelse af night_mode (override)
night_mode_suspend_until = 0

# MQTT-topic for skiltet
MQTT_SIGN_TOPIC = 'DDU_INFINITY'

# Opret labels
Hue_status = M5Label('label0', x=182, y=33, color=0x000, font=FONT_MONT_14, parent=None)
hue_label = M5Label('Hue status test:', x=30, y=33, color=0x000, font=FONT_MONT_14, parent=None)
timeLabel = M5Label('Test time', x=30, y=53, color=0x000, font=FONT_MONT_14, parent=None)
nightModeLabel = M5Label('Opdaterer night mode status...', x=30, y=73, color=0x000, font=FONT_MONT_14, parent=None)

def testHUE():
    """Tester forbindelsen til Hue-lyset (nummer 14) og opdaterer timeLabel med den aktuelle tid."""
    global ntp
    timeLabel.set_text(ntp.formatTime(':'))
    try:
        url = 'http://10.78.16.62/api/' + hue_username + '/lights/14'
        req = urequests.get(url)
        Hue_status.set_text('Ok')
        req.close()
    except Exception as e:
        Hue_status.set_text(str(e))

def fun_HUE_CONTROLLER_STATUS_REQUEST_(topic_data):
    """Henter status for alle Hue-lys og publicerer resultatet til MQTT."""
    try:
        url = 'http://10.78.16.62/api/' + hue_username + '/lights'
        req = urequests.get(url)
        m5mqtt.publish('HUE_CONTROLLER/status', req.text, 0)
        req.close()
    except Exception as e:
        m5mqtt.publish('HUE_CONTROLLER/status', str(e), 0)

def fun_HUE_CONTROLLER_COMMAND_(topic_data):
    """Modtager en kommando (i JSON-format) for et bestemt lys og sender en PUT-request til Hue API'et."""
    json_object = json.loads(topic_data)
    onBoolean = True if get_json_key(json_object, 'on') else False
    light_id = get_json_key(json_object, 'light')
    url = 'http://10.78.16.62/api/' + hue_username + '/lights/' + str(light_id) + '/state'
    try:
        req = urequests.put(url, json={'on': onBoolean}, headers={'bri': str(light_id)})
        m5mqtt.publish('HUE_CONTROLLER/status', req.text, 0)
        req.close()
    except Exception as e:
        m5mqtt.publish('HUE_CONTROLLER/status', str(e), 0)

def fun_NIGHT_MODE_OVERRIDE_(topic_data):
    """
    Udsætter night_mode i 6 timer.
    Denne funktion kaldes over MQTT på topic 'NIGHT_MODE_OVERRIDE'.
    """
    global night_mode_suspend_until
    # Sæt override til 6 timer fra nu
    night_mode_suspend_until = time.time() + 6 * 3600
    m5mqtt.publish(MQTT_SIGN_TOPIC, 'on', 0)
    nightModeLabel.set_text("Night mode override aktiv - nattilstand deaktiveret")

def check_night_mode():
    """
    Håndterer night mode:
      - Hvis override er aktiv, publiceres 'on' og label opdateres.
      - Hvis den aktuelle time er ≥ NIGHT_START eller < NIGHT_END (nattilstand):
            slukkes alle lys i night_lights, og 'off' publiceres på MQTT_SIGN_TOPIC.
      - Ellers (dagtilstand):
            tændes alle lys i day_lights, og 'on' publiceres på MQTT_SIGN_TOPIC.
    """
    try:
        # Tjek for override
        if time.time() < night_mode_suspend_until:
            m5mqtt.publish(MQTT_SIGN_TOPIC, 'on', 0)
            nightModeLabel.set_text("Night mode override aktiv - nattilstand deaktiveret")
            return

        current_hour = ntp.hour()  # Forudsætter, at ntp er initialiseret
        if current_hour >= NIGHT_START or current_hour < NIGHT_END:
            # Night mode: Sluk alle lys i night_lights
            for light_id in night_lights:
                url = 'http://10.78.16.62/api/' + hue_username + '/lights/' + str(light_id) + '/state'
                req = urequests.put(url, json={'on': False})
                req.close()
            m5mqtt.publish(MQTT_SIGN_TOPIC, 'off', 0)
            nightModeLabel.set_text("Night mode aktiv")
            timeLabel.set_text(ntp.formatTime(':'))
            Hue_status.set_text('Ok')
        else:
            # Day mode: Tænd alle lys i day_lights
            for light_id in day_lights:
                url = 'http://10.78.16.62/api/' + hue_username + '/lights/' + str(light_id) + '/state'
                req = urequests.put(url, json={'on': True})
                req.close()
            m5mqtt.publish(MQTT_SIGN_TOPIC, 'on', 0)
            nightModeLabel.set_text("Day mode aktiv")
    except Exception as e:
        Hue_status.set_text("Error in check_night_mode: " + str(e))

@timerSch.event('ntpTimer')
def tntpTimer():
    global ntp
    ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
    check_night_mode()

# Initialisering af API-nøgle, Hue-brugernavn og MQTT
apikey = '2F3158FF'
hue_username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'
m5mqtt = M5mqtt('', 'mqtt.nextservices.dk', 0, '', '', 300, ssl=True)
m5mqtt.subscribe('HUE_CONTROLLER_STATUS_REQUEST', fun_HUE_CONTROLLER_STATUS_REQUEST_)
m5mqtt.subscribe('HUE_CONTROLLER_COMMAND', fun_HUE_CONTROLLER_COMMAND_)
m5mqtt.subscribe('NIGHT_MODE_OVERRIDE', fun_NIGHT_MODE_OVERRIDE_)
m5mqtt.start()
m5mqtt.publish('KMG CONTROLLER STARTUP', 'Start', 0)

ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
# Kør check_night_mode() med det samme for at opdatere status
check_night_mode()
timerSch.run('ntpTimer', 360000, 0x00)

testHUE()
