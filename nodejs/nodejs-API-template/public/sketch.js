//currentpage skal pege på det side-id der skal være aktivt først (fra html filen) 
let currentPage = '#side-1'
let data;
function setup(){
  createCanvas(document.body.clientWidth, document.body.clientHeight)
  background(0)
  var socket = io()
  socket.on('activity', (msg) => {
    data = msg;
    console.log(msg);
    
  });
}
function drawData(){
  for(let i = 0; i<data.features.length;i++ ){
    if(!data.features[i].geometry) continue
    let x = data.features[i].geometry.coordinates[0][0]
    let y = data.features[i].geometry.coordinates[0][1]
    x = map(x,12.45,12.6,0,900);
    y = map(y,55.6,55.77,0,500)
    let name = data.features[i].properties.navn
    fill(255)
    circle(x,y,10)
    fill(255,0,0)
    textAlign(CENTER,CENTER);
    text(name,x,y)

  }
}
function windowResized() {
  resizeCanvas(document.body.clientWidth, document.body.clientHeight);
}

function draw(){
  background(0)
  if(data != undefined)
  drawData()
}






//skifter sider ud fra et id 
function shift (newPage) {
    //currentpage har hele tiden klassen 'show' - nu fjerner vi den og giver den til 'newPage'
    select(currentPage).removeClass('show')
    select(newPage).addClass('show')
    currentPage = newPage
}    

//bliver kaldt når der trykkes på keyboardet
function keyPressed(key) {
    let pageNumber = key.key - 1
    //her henter vi en liste med alle de div'er der har class='page'
    let pages = selectAll('.page')
    //og hvis der findes en side i listen med det nummer der bli er trykket på, kalder vi shift
    pages[pageNumber] && shift('#' + pages[pageNumber].elt.id)
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
  