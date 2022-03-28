//client er den variabel der bruges til at oprette forbindelse til mqtt serveren
let client 
let connectionDiv
let controllers = []
let chart

//setup er den funktion der kører, før selve web-appen går starter 
function setup() {
  connectionDiv = select('#connection')
  //det første vi gør her, er at oprette forbindelse til mqtt serveren - selve funktionen kan ses længere nede
  mqttInit()
  client.subscribe('messaging')
  //når vi modtager beskeder fra MQTT serveren kaldes denne funktion
  client.on('message', (topic, message) => {
    console.log('Received Message: ' + message.toString() + '\nOn topic: ' + topic)
    message = JSON.parse(message)
    select('#messages').html('Received message: ' + message )
    let exist = controllers.find( controller => controller.name == message.name )
    if(exist){
      console.log('already have that controller, updating battery state')
      exist.battery = message.battery
    }else{
      console.log('new controller found')
      controllers.push(message)      
    }
    console.log(controllers)
    //update chart 
    let labels = []
    let values = []
    controllers.map( controller => {
      labels.push(controller.name)
      values.push(controller.battery)
    })
    showChart(labels,values)
  })  
}


const mqttInit = () => {
  //opret et id med en random talkode og sæt gem servernavnet i en variabel
  const clientId = 'mqttjs_' + Math.random().toString(6)
  const host = 'wss://mqtt.nextservices.dk'

  //opret et objekt med de oplysninger der skal bruges til at forbinde til serveren
  const options = {
    keepalive: 300,
    clientId: clientId,
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
  client.on('connect', (t, m) => {
    console.log('Client connected:' + clientId, t)
    connectionDiv.html('<p>You are now connected to mqtt.nextservices.dk</p>')
  })

  //når forbindelsen lukkes kaldes denne funktion
  client.on('close', () => {
    console.log(clientId + ' disconnected')
  })
} 

function showChart(labels, values){
  chart && chart.destroy()

  //opret chart 
  chart = new Chart(select('#chartCanvas').elt, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
            label: labels,
            data: values,
              backgroundColor: ['red', 'lightgreen', 'lightblue'],
              borderWidth: 3
          }]
      },
    options: {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}
