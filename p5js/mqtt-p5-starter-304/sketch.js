let client 
let connectionDiv
let groups = {}

function setup() {
  connectionDiv = select('#connection')

  mqttInit()

  client.subscribe('#')

  client.on('message', async (topic, message) => {
    console.log('Received Message: ' + message.toString() + '\nOn topic: ' + topic)
    connectionDiv.html('Received message: ' + message + ' on topic ' + topic)
    if (topic.startsWith('escaperoom/')) {
      let group = topic.split('/')[1]

      groups[group] = message

      let htmlList = select('#controllers')
      htmlList.html('')

      for (const [key, value] of Object.entries(groups)) {
        htmlList.child(createElement('li', key + ': ' + value))
      }
    }
  })
}


const mqttInit = () => {
  const clientId = 'mqttjs_' + Math.random().toString(6)
  const host = 'wss://mqtt.nextservices.dk'

  const options = {
    keepalive: 300,
    clientId: clientId,
  }

  console.log('connecting mqtt client')
  
  client = mqtt.connect(host, options)
  
  client.on('connect', (t, m) => {
    console.log('Client connected:' + clientId, t)
    connectionDiv.html('You are now connected to mqtt.nextservices.dk, with client id: ' + clientId)
  })

  client.on('error', (err) => {
    console.log('Connection error: ', err)
    client.end()
  })

  client.on('reconnect', () => {
    console.log('Reconnecting...')
  })

  client.on('close', () => {
    console.log(clientId + ' disconnected')
  })
} 
