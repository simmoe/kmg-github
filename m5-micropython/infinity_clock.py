from m5stack import *
from m5ui import *
from uiflow import *
import ntptime
from m5mqtt import M5mqtt
from easyIO import *
import unit
import math

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

# Custom round: runder .5 væk fra 0 (så -24.5 → -25)
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

@timerSch.event('ecoTimer')
def tecoTimer():
  global my_12_hour, apikey, LED_DIV, hue_username, offset, middle_thing, hour_led, minute, sekunder
  # Beregn time-LED ud fra ntp.hour()
  hour_led = hour_to_led(ntp.hour())
  
  # Mapping for minutter og sekunder (eksisterende kode)
  minute = (28 - (map_value((ntp.minute()), 0, 59, 1, 49))) % 49
  sekunder = (28 - (map_value((ntp.second()), 0, 59, 1, 49))) % 49
  
  # Sæt farver for de forskellige tids-enheder
  neopixel_1.setColor((sekunder - 1), 0x66ffff)
  neopixel_1.setColor(hour_led, 0xffff00)      # Timer: gul
  neopixel_1.setColor(minute, 0x33ff33)          # Minutter: grøn
  neopixel_1.setColor(sekunder, 0x000066)         # Sekunder: mørk blå
  pass

@timerSch.event('ntpTimer')
def tntpTimer():
  global my_12_hour, apikey, LED_DIV, hue_username, offset, middle_thing, hour_led, minute, sekunder
  ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
  pass

apikey = '584E331D'
hue_username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'
m5mqtt = M5mqtt('', 'mqtt.nextservices.dk', 0, '', '', 300, ssl=True)
m5mqtt.start()
m5mqtt.publish(str('KMG CONTROLLER STARTUP'), str('Start'), 0)
neopixel_1.setBrightness(100)
ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)
timerSch.run('ntpTimer', 360000, 0x00)
timerSch.run('ecoTimer', 1000, 0x00)
while True:
  wait_ms(2)
