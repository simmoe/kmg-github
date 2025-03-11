from m5stack import *
from m5ui import *
from uiflow import *
import ntptime
from m5mqtt import M5mqtt
from easyIO import *
import unit
import math
import time

setScreenColor(0x111111)
neopixel_1 = unit.get(unit.NEOPIXEL, unit.PORTA, 49)

# Globale variabler
offset = None
my_12_hour = None
apikey = None
LED_DIV = None
hue_username = None
middle_thing = None
hour_led = None
minute = None
sekunder = None

label0 = M5TextBox(16, 97, "INFINITY", lcd.FONT_DejaVu24, 0xFFFFFF, rotate=0)

def custom_round(x):
    if x >= 0:
        return int(x + 0.5)
    else:
        return -int(abs(x) + 0.5)

def hour_to_led(hour):
    # Konverter til 12-timers format (hvor 0 bliver til 12)
    t = hour % 12
    if t == 0:
        t = 12
    # Udregn offset: (t - 12) * (49/12)
    offset = custom_round((t - 12) * (49 / 12))
    # Kl. 12 skal svare til LED 24, så:
    led = 24 - offset
    # Wrap LED til intervallet 1 til 49:
    led = ((led - 1) % 49) + 1
    return led

def compute_fade_color():
    period = 1000  # Fuld fade-cyklus på 1 sekund
    t = time.ticks_ms() % period
    phase = t / period  # Værdi mellem 0.0 og 1.0
    if phase < 0.5:
        fraction = phase * 2    # Fade ind: 0 → 1
    else:
        fraction = (1 - phase) * 2  # Fade ud: 1 → 0
    # Definer farver: mørk blå og lyseblå
    dark_blue = 0x000066
    light_blue = 0x66ffff
    r_dark = (dark_blue >> 16) & 0xFF
    g_dark = (dark_blue >> 8) & 0xFF
    b_dark = dark_blue & 0xFF
    r_light = (light_blue >> 16) & 0xFF
    g_light = (light_blue >> 8) & 0xFF
    b_light = light_blue & 0xFF
    # Interpolér farvekomponenterne
    r = int(r_dark + (r_light - r_dark) * fraction)
    g = int(g_dark + (g_light - g_dark) * fraction)
    b = int(b_dark + (b_light - b_dark) * fraction)
    return (r << 16) | (g << 8) | b

@timerSch.event('ecoTimer')
def tecoTimer():
    global hour_led, minute, sekunder, ntp
    # Beregn time-LED ud fra ntp.hour()
    hour_led = hour_to_led(ntp.hour())
  
    # Mapping for minutter og sekunder
    minute = (28 - (map_value(ntp.minute(), 0, 59, 1, 49))) % 49
    sekunder = (28 - (map_value(ntp.second(), 0, 59, 1, 49))) % 49
  
    # Sæt farver for time og minut (sekund LED opdateres separat)
    neopixel_1.setColor(hour_led, 0xffffff)   # Timer: gul
    neopixel_1.setColor(minute, 0x33ff33)       # Minutter: grøn

@timerSch.event('ntpTimer')
def tntpTimer():
    global ntp
    ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)

@timerSch.event('fadeTimer')
def fadeTimer():
    global sekunder, hour_led, minute
    # Opdater kun sekund LED'en, hvis den ikke overlapper med time eller minut
    if sekunder != hour_led and sekunder != minute:
        neopixel_1.setColor(sekunder, compute_fade_color())
    # Hvis sekunder overlapper med time/minut, bevares den eksisterende farve

apikey = '584E331D'
hue_username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'
m5mqtt = M5mqtt('', 'mqtt.nextservices.dk', 0, '', '', 300, ssl=True)
m5mqtt.start()
m5mqtt.publish(str('KMG CONTROLLER STARTUP'), str('Start'), 0)
neopixel_1.setBrightness(100)
ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)

timerSch.run('ntpTimer', 360000, 0x00)
timerSch.run('ecoTimer', 1000, 0x00)
timerSch.run('fadeTimer', 50, 0x00)

while True:
    wait_ms(2)
