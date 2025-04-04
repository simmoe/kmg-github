//currentpage skal pege på det side-id der skal være aktivt først (fra html filen) 
let currentPage = '#side-1'
//https://developers.meethue.com/develop/get-started-2/core-concepts/
//10.78.65.185/api/kgMgko5iDYljmA3ERym5GDibEkDzQTxutUSDqN36/groups

var ip = '10.78.16.62' // the hub IP address
var username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'       // fill in your Hub-given username here
var usernameField, addressField, connectButton
let url, groupUrl

var controlArray = [] // array of light control divs

function setup() {
  noCanvas()
  // set up the address and username fields:
  addressField = select('#ip').value(ip)
  usernameField = select('#username').value(username)
  connectButton = select('#connect')
  connectButton.mouseClicked(connect);

  let scenesUrl ="http://" + addressField.value() + '/api/' + usernameField.value() + '/scenes/'
  httpDo(scenesUrl, 'GET', (res)=>console.log(JSON.parse(res)))
}

/*
this function makes the HTTP GET call
to get the light data
*/
function connect() {  
  this.html("refresh")     // change the connect button to 'refresh'
  controlArray = []        // clear the control array
  url = "http://" + addressField.value() + '/api/' + usernameField.value() + '/lights/'
  httpDo(url, 'GET', getLights)
  groupUrl = "http://" + addressField.value() + '/api/' + usernameField.value() + '/groups/'
  httpDo(groupUrl, 'GET', getGroups)
}
/*
this function uses the response from the hub
to create a new div for the UI elements
*/

function getLights(result) {
  select('main').html('')
  var lightsUnsorted = JSON.parse(result) // Parse HTTP response

  // Konverter objekt til array for sortering
  let lightsArray = Object.entries(lightsUnsorted)

  //console.log("Array before sorting:", lightsArray.map(l => l[1].name)) // Log navne før sortering

  lightsArray.sort((a, b) => {
    const extractNumber = name => {
      const match = name.match(/\d+/) // Finder første tal i navnet
      return match ? parseInt(match[0], 10) : Infinity // Hvis ingen tal, læg den sidst
    }

    const nameA = a[1].name.toLowerCase()
    const nameB = b[1].name.toLowerCase()

    const isLampA = nameA.includes("color lamp")
    const isLampB = nameB.includes("color lamp")

    // Sikrer, at "color lamp" altid kommer før "smart plug"
    if (isLampA && !isLampB) return -1
    if (!isLampA && isLampB) return 1

    // Hvis begge er samme type, sorter numerisk
    const numA = extractNumber(nameA)
    const numB = extractNumber(nameB)

    return numA - numB
  })

  // Behold rækkefølgen i et array i stedet for et objekt
  let sortedLights = lightsArray.map(([key, value]) => ({ key, ...value }))

  // Loop gennem arrayet i stedet for et objekt
  sortedLights.forEach(light => {
    var controlDiv = createElement('div').addClass('light') // create a div
    controlDiv.id(light.key) // name it
    controlArray.push(controlDiv) // add it to array of light controls
    controlDiv.child(createElement('h2', light.name)) // add title to the light's div
    // create the controls inside it:
    createControl(light, controlDiv)
    select('main').child(controlDiv)
  })
}



function getGroups(result) {
  let groups = JSON.parse(result)
  //console.log(groups)

  for( groupId in groups) {
    let group = groups[groupId]
    let thisId = groupId

    let groupDiv = createElement('div').addClass('light').id(thisId)
    groupDiv.html('<h2>' + group.type + ': ' + group.name + '</h2>')

    let body = {
      "bri": group.action.bri,
      "on": group.action.on,
    }

    let brightness = createSlider(0,254, group.action.bri).mouseReleased(()=>{
        body.bri = brightness.value()
        setGroup(thisId, 'action', body)
      })  

    let myInput = createInput()                   // an input for the on property
    myInput.attribute('type', 'checkbox')     // make this input a checkbox
    group.action.on && myInput.attribute('checked', 'checked')    // is called 'checked'

    myInput.mouseClicked(()=>{
      body.on = myInput.elt.checked
      setGroup(thisId, 'action', body)        
    })      // set the mouseClicked callback
    
    let brightnessDiv = createElement('div', '<label>brightness</label>')
    brightnessDiv.child(brightness)
    groupDiv.child(myInput)
    groupDiv.child(brightnessDiv)
    select('main').child(groupDiv)
  }
}
    
async function setGroup(groupName, command, body){
    var path = groupUrl + groupName + '/' + command 		  // assemble the full URL
    console.log('setting ' + path)
    var content = JSON.stringify(body)				        // convert JSON obj to string
    await httpDo(path, 'PUT', content, 'text', setLightsCallback)  //HTTP PUT the change
}

/*
this function creates UI controls from the lights data
returned by the hub
*/
function createControl(thisLight, thisDiv) {
  console.log(thisLight, 'Et lys')
  var state = thisLight.state 	// state of this light
  var myLabel                   // each control will get a label
  var myInput                   // and input

  myLabel = createDiv().addClass('property')  // create a label span
  myLabel.html('API Nummer: ' + thisLight.key)
  thisDiv.child(myLabel);		                  // add the label to the light's div

  for (property in state) {     // iterate over  properties in state object
    myInput = null              // clear myInput from previous control
    switch (property) {         // handle the cases you care about
      case 'on':
        myInput = createInput()                   // an input for the on property
        myInput.attribute('type', 'checkbox')     // make this input a checkbox
        state.on && myInput.attribute('checked', 'checked')    // is called 'checked'
        myInput.mouseClicked(changeProperty)      // set the mouseClicked callback
        break;
      case 'bri':
        myInput = createSlider(0, 254, state.bri);	// a slider for brightness
        myInput.mouseReleased(changeProperty); // set the mouseClicked callback
        break;
      case 'hue':
        myInput = createSlider(0, 65535,state.hue);	// a slider for hue
        myInput.mouseReleased(changeProperty); // set the mouseClicked callback
        break;
      case 'sat':
        myInput = createSlider(0, 254,state.sat);		// a slider for saturation
        myInput.mouseReleased(changeProperty); // set the mouseClicked callback
        break;
      case 'colormode':
        myInput = createSpan(state.colormode);	// a label for colormode
        break;
      case 'reachable':
        myInput = createSpan(state.reachable).addClass("reachable" + state.reachable)	// a label for reachable
        break        
    }

    // you only created inputs for the fields in the switch statement
    // above, so this conditional filters for those:
    if (myInput != null) {
      myLabel = createDiv().addClass('property')  // create a label span
      myInput.elt.classList.contains('reachabletrue') && thisDiv.addClass('reachable')
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
  This function formats the name change request, then calls
  the request.
*/
function changeName(e) {
    var lightName = e.target.value;				// what did you click on?
    var thisLight = e.target.parentNode.id;	// get the parent (light number)
    var payload = {"name": lightName};        // form the name payload
    setLight(thisLight, payload, 'name');     // make the HTTP call
}

/*
this function uses the UI elements to change
the properties of the lights
*/
function changeProperty(e) {
  console.log('changing property: ' + e.target, e.target.value, e.target.parentNode.id)
  var thisControl = e.target.id			      // what did you click on?
  var thisLight = e.target.parentNode.id	// get the parent (light number)
  var value = e.target.value					     // get the value

  // make a new payload:
  var payload = {}
  // put the value for the given control into the payload:
  payload[thisControl] = Number(value);   // convert strings to numbers

  // the 'on' control is a special case, it's true/false
  // because it's a checkbox:
  if (thisControl === 'on') {
    payload[thisControl] = e.target.checked
  }

  setLight(thisLight, payload, 'state')	// make the HTTP call
}

/*
this function makes an HTTP PUT call to change
the properties of the lights
*/
function setLight(lightNumber, data, command) {
  var path = url + lightNumber + '/' + command 		  // assemble the full URL
  console.log('setting ', path, data)
  var content = JSON.stringify(data)				        // convert JSON obj to string
  httpDo( path, 'PUT', content, 'text', setLightsCallback)  //HTTP PUT the change
}

function setLightsCallback(result){
  console.log(result)
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
  