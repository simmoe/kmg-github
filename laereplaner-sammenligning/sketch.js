let ddu, kommit
let bubbles = []
function setup() {
  ddu = select('#ddu').html()
  kommit = select('#kommit').html()
  let omit = ['digital', 'design', 'data','baggrund', 'produkt', 'løsning', 'medier', 'information', 'model', 'anvendelse', 'de', 'givne', 'projekt', 'at', 'et', 'udvælge','udtryk', 'demonstrere', 'fagets', 'identitet',  'problemstilling', 'anvende', 'viden', 'deres', 'fokus', 'formulere', 'som', 'om', 'egen','metode', 'en', 'for', 'den', 'relevant','system','behandling', 'brug', 'tekst', 'samt', 'muligheder', 'af', 'og', '\n', 'med', 'på', 'i', "", 'det', 'herunder', 'til', 'forskellige', 'forståelse', 'værktøjer', 'forbindelse', 'relevante']
  
  ddu = ddu.split(' ')
  ddu = ddu.filter( d => !omit.includes(d))
  kommit = kommit.split(' ')
  kommit = kommit.filter( d => !omit.includes(d))
  
  ddu.map( d => {
    //tjek om d findes i bubbles 
    let exist = bubbles.findIndex ( b => b.name.toLowerCase() == d )
    if(exist == -1){
      bubbles.push({name:d.toLowerCase(), count:1, dduCount:1, kommCount:0})
    }else{
      bubbles[exist].count =  bubbles[exist].count + 1
      bubbles[exist].dduCount =  bubbles[exist].dduCount + 1
    }    
  })
  kommit.map( d => {
    //tjek om d findes i bubbles 
    let exist = bubbles.findIndex ( b => b.name.toLowerCase() == d )
    if(exist == -1){
      bubbles.push({name:d.toLowerCase(), count:1, kommCount:1})
    }else{
      bubbles[exist].count =  bubbles[exist].count + 1
      bubbles[exist].kommCount =  bubbles[exist].kommCount + 1
    }    
  })

  bubbles = bubbles.filter( b => b.kommCount > 0 && b.dduCount > 0)
  bubbles.sort( (a, b) => (a.count > b.count) ? -1 : 1 )
  console.log(bubbles)

  for(i=0;i<20;i++){
    let circle = createDiv().class('circle')
    circle.child(createDiv()
      .style('width', bubbles[i].count * 15 + 'px')
      .style('height', bubbles[i].count * 15 + 'px')
      .class('innerCircle')
      .child(createDiv(bubbles[i].name + '<span>ddu: ' + bubbles[i].dduCount + '<br>komm: ' + bubbles[i].kommCount)))
    select('#circles').child(circle)
  }
}

function draw() {

}


































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

function showChart(){
  //opret chart 
  chart = new Chart(select('#chartCanvas').elt, {
      type: 'bar',
      data: {
        labels: ['hej', 'med', 'dig'],
        datasets: [{
            label: 'Resultat',
            data: [33,10,23],
              backgroundColor: ['lightred', 'lightgreen', 'lightblue'],
              borderWidth: 3
          }]
      },
  });
}
