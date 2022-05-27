//currentpage skal pege på det side-id der skal være aktivt først (fra html filen) 
let currentPage = '#side-1'
//https://developers.meethue.com/develop/get-started-2/core-concepts/
//10.78.65.185/api/kgMgko5iDYljmA3ERym5GDibEkDzQTxutUSDqN36/groups

var ip = '10.78.65.185' // the hub IP address
var username = 'kgMgko5iDYljmA3ERym5GDibEkDzQTxutUSDqN36'       // fill in your Hub-given username here
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
  console.log(JSON.parse(result))
  select('main').html('')
  var lights = JSON.parse(result)		          // parse the HTTP response
  for (thisLight in lights) {			            // iterate over each light in the response
    var controlDiv = createElement('div').addClass('light')		// create a div
    controlDiv.id(thisLight)				          // name it
    controlArray.push(controlDiv);            // add it to array of light controls
    controlDiv.child(createElement('h2', lights[thisLight].name))	// add title to the light's div
    // create the controls inside it:
    createControl(lights[thisLight], controlDiv)
    select('main').child(controlDiv)
  }
}
function getGroups(result) {
  let K2 = JSON.parse(result)
  //were only interested in the first group, K2 
  K2 = Object.values(K2)[0]
  let FROG = Object.values(K2)[6]
  //console.log('frog', FROG)

  let groupDiv = createElement('div').addClass('light')
  groupDiv.html('<h2>Gruppe: ' + K2.name + '</h2>')
  let body = {
    "hue": K2.action.hue,
    "bri": K2.action.bri,
    "sat": 254,
    "on": K2.action.on,
  }
  let brightness = createSlider(0,254, K2.action.bri).mouseReleased(()=>{
    body.bri = brightness.value()
    setGroup(K2.name, 'action', body)
  })
  let red = createButton('red').mouseReleased(()=>{
    body.hue = 65535
    setGroup(K2.name, 'action', body)
  })
  let green = createButton('green').mouseReleased(()=>{
    body.hue = 25500
    setGroup(K2.name, 'action', body)
  })
  let blue = createButton('blue').mouseReleased(()=>{
    body.hue = 46920
    setGroup(K2.name, 'action', body)
  })
  let hueInput = createInput(K2.action.hue).mouseReleased(()=>{
    body.hue = hueInput.value()
    setGroup(K2.name, 'action', body)
  })
  let satInput = createInput(K2.action.sat).mouseReleased(()=>{
    body.sat = satInput.value()
  })
  hueSatBtn = createButton('set').mouseReleased(()=>setGroup(K2.name, 'action', body))


  let currentColor = ColorConverter.xyBriToRgb(K2.action.xy[0], K2.action.xy[1], K2.action.bri)
  currentColor = ColorConverter.rgbToHex(currentColor.r, currentColor.g, currentColor.b)
  console.log(currentColor)
  let picker = createColorPicker(currentColor)
  let pickerBtn = createButton('go')
  pickerBtn.mouseReleased(()=>{
    let rgbColor = ColorConverter.hexToRgb(picker.value())
    let xyColor = ColorConverter.rgbToXy(rgbColor.levels[0], rgbColor.levels[1], rgbColor.levels[2])
    console.log(xyColor)
    body = {
      xy: [xyColor.x, xyColor.y]
    }
    setGroup(K2.name, 'action', body)
  })

  let hueSatDiv = createElement('div', '<label>hue and saturation</label>')
  hueSatDiv.child(hueInput)
  hueSatDiv.child(satInput)
  hueSatDiv.child(hueSatBtn)

  let pickerDiv = createElement('div', '<label>pick a color</label>')
  pickerDiv.child(picker)
  pickerDiv.child(pickerBtn)
  let brightnessDiv = createElement('div', '<label>brightness</label>')
  brightnessDiv.child(brightness)
  let colorDiv = createElement('div', '<label>color</label>')
  colorDiv.child(red)
  colorDiv.child(green)
  colorDiv.child(blue)
  groupDiv.child(brightnessDiv)
  groupDiv.child(colorDiv)
  groupDiv.child(hueSatDiv)
  groupDiv.child(pickerDiv)
  select('main').child(groupDiv)
}

async function setGroup(groupName, command, body){
  var path = groupUrl + groupName + '/' + command 		  // assemble the full URL
  console.log('setting ' + path)
  var content = JSON.stringify(body)				        // convert JSON obj to string
  await httpDo(path, 'PUT', content, 'text', setLightsCallback)  //HTTP PUT the change
  await httpDo(url, 'GET', getLights)
  httpDo(groupUrl, 'GET', getGroups)
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
      // case 'ct':
      //   myInput = createSlider(153, 500,state.ct);	// a slider for color temp
      //   myInput.mouseReleased(changeProperty); // set the mouseClicked callback
      //   break;
/*       case 'xy':
        myInput = createElement('div')
        let rgb = ColorConverter.xyBriToRgb(state.xy[0], state.xy[1],state.bri)
        let hex = ColorConverter.rgbToHex(rgb.r, rgb.g, rgb.b)
        let myColor = createColorPicker(hex)
        let myBtn = createButton('set')
        myBtn.mouseReleased(() => {
          let rgb = ColorConverter.hexToRgb(myColor.value())
          let CIE = ColorConverter.rgbToXy(rgb.levels[0],rgb.levels[1], rgb.levels[2] )
          let body = {
            "hue": 50000,
            "on": true,
            "xy": [CIE.x, CIE.y]
          }
          setLight(thisDiv.elt.id, body, 'state')
        })
        myInput.child(myColor)
        myInput.child(myBtn)
        break;
 */      case 'colormode':
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
  