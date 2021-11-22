let iframe = document.querySelector('#iframe')
let tags = document.querySelector('#tags')

const toggleIframe = (url, howlong) => {
  iframe.src = url
  iframe.style.left = 0
  setTimeout(()=>iframe.style.left='-100vw', howlong)
}

const toggleHtml = (html, howlong) => {
  tags.innerHTML = html
  tags.style.left = 0
  setTimeout(()=>tags.style.left='-100vw', howlong)
}


function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

document.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      toggleFullScreen();
    }
    if (e.key === "c") {
        html.style.left == '-100vw' ? (html.style.left = '0') : (html.style.left = '-100vw') 
      }
  
}, false);

const mqttInit = () => {
  //opret et id med en random talkode og sæt gem servernavnet i en variabel
  const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8)
  const host = 'wss://mqtt.nextservices.dk'

  //opret et objekt med de oplysninger der skal bruges til at forbinde til serveren
  const options = {
    keepalive: 300,
    clientId: clientId,
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    will: {
      topic: 'WillMsg',
      payload: 'Connection Closed abnormally..!',
      qos: 0,
      retain: false
    },
    rejectUnauthorized: false
  }

  console.log('connecting mqtt client')

  //forsøg at oprette forbindelse 
  client = mqtt.connect(host, options)

  //hvis der sker en fejl kaldes denne funktion
  client.on('error', (err) => {
    console.log('Connection error: ', err)
    client.end()
  })

  //og hvis forbindelsen mistes kaldes denne funktion
  client.on('reconnect', () => {
    console.log('Reconnecting...')
  })

  //hvis forbindelsen lykkes kaldes denne funktion
  client.on('connect', () => {
    console.log('Client connected:' + clientId)
  })

  //når forbindelsen lukkes kaldes denne funktion
  client.on('close', () => {
    console.log(clientId + ' disconnected')
  })
} 

mqttInit()


client.subscribe('rasperry/+')
  //når vi modtager beskeder fra MQTT serveren kaldes denne funktion
  client.on('message', (topic, message) => {
    const obj = JSON.parse(message)
    console.log(obj)
    if(obj.content == 'webpage'){
      toggleIframe(obj.url, obj.howlong)
    } 
    if(obj.content == 'html'){
      toggleHtml(obj.html, obj.howlong)
    } 
    if(obj.content == 'reload'){
      location.reload()
    } 
            
    console.log('Received Message: ' + obj + '\nOn topic: ' + topic)
  })  


































