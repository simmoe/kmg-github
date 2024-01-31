let client 
//connectionDiv peger på et DIV element i HTML siden 
let connectionDiv
var vol;

let columns = 10;
let colPos = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900]

//setup er den funktion der kører, før selve web-appen starter 
function setup() {

  createCanvas(1000, 600);
  //tag fat i en div i HTML dokumentet - med id "connection"
  connectionDiv = select('#connection')

  //forsøg at oprette forbindelse til MQTT serveren 
  client = mqtt.connect('wss://mqtt.nextservices.dk')

  //hvis forbindelsen lykkes kaldes denne funktion
  client.on('connect', (m) => {
    console.log('Client connected: ', m)
    connectionDiv.html('You are now connected to mqtt.nextservices.dk')
  })

  //subscribe på emnet 'programmering'
  client.subscribe('viking/lyd')

  //når vi modtager beskeder fra MQTT serveren kaldes denne funktion
  client.on('message', (topic, message) => {
    //console.log('Received Message: ' + message.toString())
    //console.log('On Topic: ' + topic)

    vol = message;

    //Sæt beskeden ind på hjemmesiden 
    connectionDiv.html('<span color="#ffff00">Modtager beskeder</span>' + message + '</b> fra: <b>' + topic + '</b>')
  })
    frameRate(5);
}

function draw(){
  background(255);
  fill(255,0,0);
  stroke(1);


    rect(colPos[0], height , 100, -vol/2);
    
}
