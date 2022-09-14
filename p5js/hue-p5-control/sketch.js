//https://developers.meethue.com/develop/get-started-2/core-concepts/

var ip = '10.78.65.185' // the hub IP address
var username = 'kgMgko5iDYljmA3ERym5GDibEkDzQTxutUSDqN36';       // fill in your Hub-given username here
var myLight = 2
var usernameField, addressField, connectButton;

var controlArray = [] // array of light control divs

function setup() {
  noCanvas()
  // set up the address and username fields:
  addressField = select('#ip').value(ip)
  usernameField = select('#username').value(username)
  connectButton = select('#connect')
  connectButton.mouseClicked(connect);
}

/*
this function makes the HTTP GET call
to get the light data
*/

function connect() {
  this.html("refresh")      // change the connect button to 'refresh'
  select('main').html('')   //empty the webpage
  url = "http://" + addressField.value() + '/api/' + usernameField.value() + '/lights/' + myLight + '/'
  httpDo(url, 'GET', getLight)
}

/*
this function uses the response from the hub
to create a new div for the UI elements
*/
function getLight(light) {
  console.log(light)
  var light = JSON.parse(light)		          // parse the HTTP response
  var controlDiv = createElement('div').addClass('light')		// create a div
  controlDiv.id(light)				          // name it
  controlArray.push(controlDiv);            // add it to array of light controls
  // create an input field:
  var nameField = createElement('h2',light.name, 'text')
  nameField.id(light.name)      // give the input a value
  controlDiv.child(nameField)	  	          // add the field to the light's div
  // create the controls inside it:
  createControl(light, controlDiv)
  select('main').child(controlDiv)
}

/*
this function creates UI controls from the lights data
returned by the hub
*/
function createControl(thisLight, thisDiv) {
  var state = thisLight.state 	// state of this light
  var myLabel                   // each control will get a label
  var myInput                   // and input

  for (property in state) {     // iterate over  properties in state object
    myInput = null              // clear myInput from previous control
    switch (property) {         // handle the cases you care about
      case 'on':
        myInput = createInput() // an input for the on property
        myInput.attribute('type', 'checkbox')    // make this input a checkbox
        myInput.attribute('checked', state.on)   // is called 'checked'
        myInput.mouseClicked(changeProperty)     // set the mouseClicked callback
        break;
      case 'bri':
        myInput = createSlider(0, 254, state.bri);	// a slider for brightness
        myInput.changed(changeProperty); // set the mouseClicked callback
        break;
      case 'hue':
        myInput = createSlider(0, 65535,state.hue);	// a slider for hue
        myInput.changed(changeProperty); // set the mouseClicked callback
        break;
      case 'sat':
        myInput = createSlider(0, 254,state.sat);		// a slider for saturation
        myInput.changed(changeProperty); // set the mouseClicked callback
        break;
      case 'ct':
        myInput = createSlider(153, 500,state.ct);	// a slider for color temp
        myInput.changed(changeProperty); // set the mouseClicked callback
        break;
      case 'colormode':
        myInput = createSpan(state.colormode);	// a label for colormode
        break;
      case 'reachable':
        myInput = createSpan(state.reachable);	// a label for reachable
        break        
    }

    // you only created inputs for the fields in the switch statement
    // above, so this conditional filters for those:
    if (myInput != null) {
      myLabel = createDiv().addClass('property')  // create a label span
      myInput.id(property)                        // give the input an id
      myLabel.html(property) 
      thisDiv.child(myLabel);		                  // add the label to the light's div
      thisDiv.child(myInput);		                  // add the input to the light's div
    }
  }   
  // end of for-loop to create controls
  thisDiv.child(myInput)
}


/*
this function uses the UI elements to change
the properties of the lights
*/

function changeProperty(e) {
  console.log('change property')
  var thisControl = e.target.id;				  // what did you click on?
  var thisLight = e.target.parentNode.id;	// get the parent (light number)
  var value = e.target.value;					    // get the value

  // make a new payload:
  var payload = {};
  // put the value for the given control into the payload:
  payload[thisControl] = Number(value);   // convert strings to numbers

  // the 'on' control is a special case, it's true/false
  // because it's a checkbox:
  if (thisControl === 'on') {
    payload[thisControl] = e.target.checked;
  }

  setLight(thisLight, payload, 'state');	// make the HTTP call
}

/*
this function makes an HTTP PUT call to change
the properties of the lights
*/
function setLight(lightNumber, data, command) {
  console.log('setting')
  var path = url + 'state'		  // assemble the full URL
  console.log(url)
  var content = JSON.stringify(data);				        // convert JSON obj to string
  httpDo( path, 'PUT', content, 'text', getLight); //HTTP PUT the change
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
  




