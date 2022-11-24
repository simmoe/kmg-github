let client 
let connectionDiv
let groups = []

function setup() {
  connectionDiv = select('#connection')

  mqttInit()

  client.subscribe('#')

  client.on('message', async (topic, message) => {
    console.log('Received Message: ' + message.toString() + '\nOn topic: ' + topic)
    connectionDiv.html('Received message: ' + message )
	if (topic.startsWith('lokale304/')) {
		let group = topic.split('/')[1]

		if (!groups.includes(group)) {
			groups.push({
				name: group,
				msg: message,
			})
		}

		let htmlList = select('#controllers')
		htmlList.html('')

		groups.map( g => {
			htmlList.child(createElement('li', g.name + ': ' + g.msg))
		})
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
