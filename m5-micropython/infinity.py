from m5stack import *
from m5ui import *
from uiflow import *
from m5mqtt import M5mqtt
import unit

setScreenColor(0x111111)
neopixel_0 = unit.get(unit.NEOPIXEL, unit.PORTA, 84)


waitSeconds = None
fade = None
color = None
intensity = None
waiting = None
waitShorterTime = None
waitLongTime = None
i = None




from numbers import Number


# Describe this function...
def restart():
  global waitSeconds, fade, color, intensity, waiting, waitShorterTime, waitLongTime, i
  fade = False
  intensity = 0
  waitSeconds = waitShorterTime
  waiting = False


def fun_K2Light_(topic_data):
  global waitSeconds, fade, color, intensity, waiting, waitShorterTime, waitLongTime, i
  color[-1] = 255
  color[0] = 69
  color[1] = 0
  restart()
  pass

def fun_stick_1001_(topic_data):
  global waitSeconds, fade, color, intensity, waiting, waitShorterTime, waitLongTime, i
  color[-1] = 255
  color[0] = 0
  color[1] = 255
  restart()
  pass

@timerSch.event('fade')
def tfade():
  global waitSeconds, fade, color, intensity, waiting, waitShorterTime, waitLongTime, i
  if not waiting:
    if fade:
      intensity = (intensity if isinstance(intensity, Number) else 0) + -1
    else:
      intensity = (intensity if isinstance(intensity, Number) else 0) + 1
    if intensity == 100 or intensity == 0:
      if intensity == 0:
        color[-1] = 255
        color[0] = 255
        color[1] = 255
        waitSeconds = waitLongTime
      else:
        waitSeconds = waitShorterTime
      fade = not fade
      waiting = True
      timerSch.run('wait', 1000, 0x00)
    neopixel_0.setBrightness(intensity)
  pass

@timerSch.event('wait')
def twait():
  global waitSeconds, fade, color, intensity, waiting, waitShorterTime, waitLongTime, i
  waitSeconds = (waitSeconds if isinstance(waitSeconds, Number) else 0) + -1
  if waitSeconds == 0:
    waiting = False
  pass


m5mqtt = M5mqtt('', 'mwtt.nextservices.dk', 0, '', '', 300, ssl = True)
m5mqtt.subscribe(str('K2Light'), fun_K2Light_)
m5mqtt.subscribe(str('stick-1001'), fun_stick_1001_)
m5mqtt.start()
color = [255, 255, 255]
fade = False
intensity = 0
waitLongTime = 600
waitShorterTime = 100
waiting = False
timerSch.run('fade', 124, 0x00)
while True:
  for i in range(11, 85):
    neopixel_0.setColorFrom(11,84,(color[-1] << 16) | (color[0] << 8) | color[1])
    neopixel_0.setColor(i, 0x000000)
  wait_ms(2)
