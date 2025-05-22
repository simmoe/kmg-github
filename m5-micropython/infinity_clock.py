from m5stack import *
from m5ui import *
from uiflow import *
import ntptime
# Removed MQTT import
# from m5mqtt import M5mqtt
from easyIO import *
import unit
import math
import time
import machine
import gc  # Import garbage collection module

setScreenColor(0x111111)
neopixel_1 = unit.get(unit.NEOPIXEL, unit.PORTA, 49)
rtc = machine.RTC()

# Globale variabler
apikey = '584E331D'
hue_username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'
hour_led = None
minute_led = None
last_minute = -1
minute_fade_start = None
fade_duration = 3000
FADE_INTERVAL = 10
last_hour = -1

neopixel_1.setBrightness(255)

# Initialize the watchdog timer
wdt = machine.WDT(timeout=10000)  # 10-second timeout

# Track start time for periodic reset
reset_interval_ms = 24 * 60 * 60 * 1000  # 24 hours in ms
start_time = time.ticks_ms()

def get_danish_time():
    utc_secs = time.time()  # RTC i sekunder = UTC
    utc = time.localtime(utc_secs)
    year, month, mday = utc[0], utc[1], utc[2]

    # Find sidste søndag i marts/oktober
    def last_sunday(year, month):
        for day in range(31, 24, -1):
            if time.localtime(time.mktime((year, month, day, 0, 0, 0, 0, 0)))[6] == 6:
                return day

    # Bestem om vi er i dansk sommertid (DST)
    dst = (
        (month > 3 and month < 10) or
        (month == 3 and mday >= last_sunday(year, 3)) or
        (month == 10 and mday < last_sunday(year, 10))
    )

    offset = 1 * 3600 if dst else 0 * 3600
    return time.localtime(utc_secs + offset)

def custom_round(x):
    return int(x + 0.5) if x >= 0 else -int(abs(x) + 0.5)

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
    x = max(0, min(1, x))
    return x * x * (3 - 2 * x)

@timerSch.event('ecoTimer')
def tecoTimer():
    global hour_led, minute_led, last_minute, minute_fade_start

    t = get_danish_time()
    current_hour = t[3]
    current_minute = t[4]

    hour_led = hour_to_led(current_hour)
    minute_led = minute_to_led(current_minute)

    if current_minute != last_minute:
        minute_fade_start = time.ticks_ms()
        last_minute = current_minute

    try:
        neopixel_1.setColor(hour_led, 0xffffff)
    except Exception:
        pass  # Ignore errors to prevent hangs

@timerSch.event('ntpTimer')
def tntpTimer():
    try:
        ntptime.host = 'dk.pool.ntp.org'
        ntptime.settime()
    except Exception:
        pass  # Ignore errors to prevent hangs

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

        try:
            if led == minute_led:
                factor = 1.0
                if minute_fade_start is not None:
                    elapsed = time.ticks_diff(time.ticks_ms(), minute_fade_start)
                    if elapsed < fade_duration:
                        phase = elapsed / fade_duration
                        factor = 1.0 - (phase * 2) if phase < 0.5 else (phase - 0.5) * 2
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
        except Exception:
            pass  # Ignore errors to prevent hangs

# Start timere
timerSch.run('ntpTimer', 360000, 0x00)     # Sync NTP hvert 6. minut
timerSch.run('ecoTimer', 1000, 0x00)       # Opdater hver sekund
timerSch.run('fadeTimer', FADE_INTERVAL, 0x00)

# Main loop
while True:
    wait_ms(2)
    wdt.feed()  # Feed the watchdog
    gc.collect()  # Run garbage collection
    # Brute-force reset every 24 hours
    if time.ticks_diff(time.ticks_ms(), start_time) > reset_interval_ms:
        machine.reset()