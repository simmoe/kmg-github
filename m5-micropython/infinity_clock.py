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
apikey = None
hue_username = None
hour_led = None
minute_led = None
last_minute = -1
minute_fade_start = None
fade_duration = 3000  # Fade varighed i ms (3 sekunder)

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
    offset = custom_round((t - 12) * (49 / 12))
    led = 24 - offset
    led = ((led - 1) % 49) + 1
    return led

def minute_to_led(minute):
    # Mapper 0-59 minutter til LED-positioner med LED 24 for 0 minutter
    offset = custom_round(minute * (49 / 60))
    led = 24 - offset
    led = ((led - 1) % 49) + 1
    return led

@timerSch.event('ecoTimer')
def tecoTimer():
    global hour_led, minute_led, ntp, last_minute, minute_fade_start
    current_minute = ntp.minute()
    hour_led = hour_to_led(ntp.hour())
    minute_led = minute_to_led(current_minute)
    # Ved minutændring startes fade-effekten
    if current_minute != last_minute:
        minute_fade_start = time.ticks_ms()
        last_minute = current_minute
    neopixel_1.setColor(hour_led, 0xffffff)   # Time-LED: hvid

@timerSch.event('ntpTimer')
def tntpTimer():
    global ntp
    ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)

@timerSch.event('fadeTimer')
def fadeTimer():
    global hour_led, minute_led, minute_fade_start, fade_duration
    period = 60000  # 60 sekunder for sekund-snake
    ms = time.ticks_ms() % period
    # Beregn sekund-snake position (bevægelse med uret)
    pos = 49 - ((ms / period) * 49)
    snake_length = 5
    base_color = 0x0000FF  # Kraftig blå til sekund-snake

    for led in range(1, 50):
        pos_led = led - 1  # 0-indekseret position
        d = abs(pos_led - pos)
        if d > 24.5:
            d = 49 - d

        if led == minute_led:
            # Minutviseren: varm orange (0xFF4500) med fade-effekt
            factor = 1.0
            if minute_fade_start is not None:
                elapsed = time.ticks_diff(time.ticks_ms(), minute_fade_start)
                if elapsed < fade_duration:
                    phase = elapsed / fade_duration
                    # Fade ud og herefter ind: 1 -> 0 -> 1 over 3 sekunder
                    if phase < 0.5:
                        factor = 1.0 - (phase * 2)  # fra 1 til 0
                    else:
                        factor = (phase - 0.5) * 2   # fra 0 til 1
                else:
                    minute_fade_start = None
            r = int(0xFF * factor)
            g = int(0x45 * factor)
            b = 0
            minute_color = (r << 16) | (g << 8) | b
            neopixel_1.setColor(led, minute_color)
        elif led == hour_led:
            # Time-LED forbliver hvid (sat af ecoTimer)
            continue
        else:
            # Sekund-snake effekt med lineær fade
            if d < snake_length:
                factor = 1.0 - (d / snake_length)
                r = int(((base_color >> 16) & 0xFF) * factor)
                g = int(((base_color >> 8) & 0xFF) * factor)
                b = int((base_color & 0xFF) * factor)
                color = (r << 16) | (g << 8) | b
            else:
                color = 0x000000
            neopixel_1.setColor(led, color)

apikey = '584E331D'
hue_username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'
m5mqtt = M5mqtt('', 'mqtt.nextservices.dk', 0, '', '', 300, ssl=True)
m5mqtt.start()
m5mqtt.publish(str('KMG CONTROLLER STARTUP'), str('Start'), 0)
neopixel_1.setBrightness(255)  # Ful d. intensitet
ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)

timerSch.run('ntpTimer', 360000, 0x00)
timerSch.run('ecoTimer', 1000, 0x00)
timerSch.run('fadeTimer', 50, 0x00)

while True:
    wait_ms(2)
