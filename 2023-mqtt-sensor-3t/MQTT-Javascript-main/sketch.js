//client er den variabel der bruges til at oprette forbindelse til mqtt serveren
let client 
//connectionDiv peger på et DIV element i HTML siden 
let connectionDiv

const alldata = [];

//setup er den funktion der kører, før selve web-appen starter 
function setup() {
  //tag fat i en div i HTML dokumentet - med id "connection"
  connectionDiv = select('#connection')
  
  //forsøg at oprette forbindelse til MQTT serveren 
  client = mqtt.connect('wss://mqtt.nextservices.dk')

  //hvis forbindelsen lykkes kaldes denne funktion
  client.on('connect', (m) => {
    console.log('Client connected: ', m)
    connectionDiv.html('You are now connected to mqtt.nextservices.dk')
  })
  
  //subscribe poå emnet programmering
  client.subscribe('fm')
  
  //når vi modtager beskeder fra MQTT serveren kaldes denne funktion
  client.on('message', (topic, message) => {
    console.log('Received Message: ' + message.toString())
    console.log('On Topic: ' + topic)

    //Sæt beskeden ind på hjemmesiden 
    

    
    if (message == 1) {
      const myElement = document.getElementById("all");
      myElement.style.backgroundColor = "red";
      alldata.push('<b> MOTION </b> on '+ Date())
    } else if (message == 0) {
      const myElement = document.getElementById("all");
      myElement.style.backgroundColor = "blue";
    } else {
      alldata.push('Received message: <b>' + message + '</b> on topic: <b>' + topic + '</b> on Date: '+ Date());
    }

    let htmlList = select('#controllers');
    htmlList.html('');
    for (let i = alldata.length; i >= 0; i--) {
      htmlList.child(createElement('ol', [alldata[i]]));
    }

  })  
}