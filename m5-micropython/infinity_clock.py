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
FADE_INTERVAL = 10  # Opdateringsinterval for fadeTimer i ms – kan ændres for test
last_hour = -1  # Gem sidst publicerede time


def custom_round(x):
    if x >= 0:
        return int(x + 0.5)
    else:
        return -int(abs(x) + 0.5)

def hour_to_led(hour):
    t = hour % 12
    if t == 0:
        t = 12
    offset = custom_round((t - 12) * (49 / 12))
    led = 24 - offset
    led = ((led - 1) % 49) + 1
    return led

def minute_to_led(minute):
    offset = custom_round(minute * (49 / 60))
    led = 24 - offset
    led = ((led - 1) % 49) + 1
    return led

def smoothstep(x):
    if x < 0:
        x = 0
    elif x > 1:
        x = 1
    return x * x * (3 - 2 * x)

@timerSch.event('ecoTimer')
def tecoTimer():
    global hour_led, minute_led, ntp, last_minute, minute_fade_start, last_hour
    current_minute = ntp.minute()
    current_hour = ntp.hour()

    hour_led = hour_to_led(current_hour)
    minute_led = minute_to_led(current_minute)

    if current_minute != last_minute:
        minute_fade_start = time.ticks_ms()
        last_minute = current_minute

    neopixel_1.setColor(hour_led, 0xffffff)


@timerSch.event('ntpTimer')
def tntpTimer():
    global ntp
    ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)

@timerSch.event('fadeTimer')
def fadeTimer():
    global hour_led, minute_led, minute_fade_start, fade_duration
    period = 60000
    ms = time.ticks_ms() % period
    pos = 49 - ((ms / period) * 49)
    snake_length = 5
    base_color = 0x0000FF

    for led in range(1, 50):
        pos_led = led - 1
        d = abs(pos_led - pos)
        if d > 24.5:
            d = 49 - d

        if led == minute_led:
            factor = 1.0
            if minute_fade_start is not None:
                elapsed = time.ticks_diff(time.ticks_ms(), minute_fade_start)
                if elapsed < fade_duration:
                    phase = elapsed / fade_duration
                    if phase < 0.5:
                        factor = 1.0 - (phase * 2)
                    else:
                        factor = (phase - 0.5) * 2
                else:
                    minute_fade_start = None
            r = int(0xFF * factor)
            g = int(0x45 * factor)
            b = 0
            minute_color = (r << 16) | (g << 8) | b
            neopixel_1.setColor(led, minute_color)
        elif led == hour_led:
            continue
        else:
            if d < snake_length:
                t = d / snake_length
                factor = 1.0 - smoothstep(t)
                r = int(((base_color >> 16) & 0xFF) * factor)
                g = int(((base_color >> 8) & 0xFF) * factor)
                b = int((base_color & 0xFF) * factor)
                color = (r << 16) | (g << 8) | b
            else:
                color = 0x000000
            neopixel_1.setColor(led, color)

apikey = '584E331D'
hue_username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'
neopixel_1.setBrightness(255)
ntp = ntptime.client(host='dk.pool.ntp.org', timezone=1)

timerSch.run('ntpTimer', 360000, 0x00)
timerSch.run('ecoTimer', 1000, 0x00)
timerSch.run('fadeTimer', FADE_INTERVAL, 0x00)

while True:
    wait_ms(2)
