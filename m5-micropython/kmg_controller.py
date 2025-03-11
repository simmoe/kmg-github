from m5stack import *
from m5stack_ui import *
from uiflow import *
import urequests
import ntptime
import json
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
night_lights = [8, 9, 10, 11, 12, 13, 14]  # Lys der skal slukkes om natten

# Globale tidspunkter for nattilstand (24-timers format)
NIGHT_START = 23  # Nat starter kl. 23:00
NIGHT_END = 7     # Nat slutter kl. 07:00

# Opret labels
Hue_status = M5Label('label0', x=182, y=33, color=0x000, font=FONT_MONT_14, parent=None)
hue_label = M5Label('Hue status test:', x=30, y=33, color=0x000, font=FONT_MONT_14, parent=None)
timeLabel = M5Label('Test time', x=30, y=53, color=0x000, font=FONT_MONT_14, parent=None)

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
        m5mqtt.publish('HUE_CONTROLLER_STATUS', req.text, 0)
        req.close()
    except Exception as e:
        m5mqtt.publish('HUE_CONTROLLER_STATUS', str(e), 0)

def check_night_mode():
    """Slukker for alle lys i night_lights, hvis klokken er mellem NIGHT_START og NIGHT_END."""
    try:
        current_hour = ntp.hour()  # Forudsætter, at ntp er initialiseret
        if current_hour >= NIGHT_START or current_hour < NIGHT_END:
            for light_id in night_lights:
                url = 'http://10.78.16.62/api/' + hue_username + '/lights/' + str(light_id) + '/state'
                req = urequests.put(url, json={'on': False})
                req.close()
    except Exception as e:
        print("Error in check_night_mode:", e)

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
m5mqtt.start()
m5mqtt.publish('KMG CONTROLLER STARTUP', 'Start', 0)

ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
timerSch.run('ntpTimer', 360000, 0x00)

testHUE()
