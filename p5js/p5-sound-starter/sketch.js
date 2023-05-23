
let osc, playing, freq, amp;

//client er den variabel der bruges til at oprette forbindelse til mqtt serveren
let client 
//connectionDiv peger på et DIV element i HTML siden 
let connectionDiv

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
  client.subscribe('daisychain')
  
  //når vi modtager beskeder fra MQTT serveren kaldes denne funktion
  client.on('message', (topic, message) => {
    console.log('Received Message: ' + message.toString())
    console.log('On Topic: ' + topic)

    //Sæt beskeden ind på hjemmesiden 
    connectionDiv.html('Received message: <b>' + message + '</b> on topic: <b>' + topic + '</b>')

    freq = map(parseInt(message), 0, 500, 100, 500);
    amp = 1;
  
  })  

  let cnv = createCanvas(100, 100);
  cnv.mousePressed(playOscillator);
  osc = new p5.Oscillator('sine');
}



function draw() {
  background(220)
  // freq = constrain(map(mouseX, 0, width, 100, 500), 100, 500);
  // amp = constrain(map(mouseY, height, 0, 0, 1), 0, 1);

  text('tap to play', 20, 20);
  text('freq: ' + freq, 20, 40);
  text('amp: ' + amp, 20, 60);

  if (playing) {
    // smooth the transitions by 0.1 seconds
    osc.freq(freq, 0.1);
    osc.amp(amp, 0.1);
  }
}

function playOscillator() {
  // starting an oscillator on a user gesture will enable audio
  // in browsers that have a strict autoplay policy.
  // See also: userStartAudio();
  osc.start();
  playing = true;
}

function mouseReleased() {
  // ramp amplitude to 0 over 0.5 seconds
  //osc.amp(0, 0.5);
  //playing = false;
}