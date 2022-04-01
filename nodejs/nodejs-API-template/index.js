const express = require('express');
const axios = require('axios');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server)
app.use(express.static('public'))

io.on('connection', (socket) => {
  console.log('a user connected');
  getActivity()
});

//api stuff
let api_url 

//metherological data
//api_url = 'https://dmigw.govcloud.dk/v2/lightningdata'
//const apiKeyLightning = '513232a7-850e-4837-b73e-d1b445baa84d'
//const apiKeyMeteo = '42b0ca74-42a2-476a-9abf-b47f3dd9bfd7'
// headers: {
//   'X-Gravitee-Api-Key' : '42b0ca74-42a2-476a-9abf-b47f3dd9bfd7'
// }

//københavns kommune kort 
//url: 'https://wfs-kbhkort.kk.dk/k101/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=k101:station_oversigtskort&outputFormat=json&SRSNAME=EPSG:4326',

//energi danmark 
api_url = "https://api.energidataservice.dk/datastore_search?resource_id=consumptionde35hour&limit=5"

const getActivity = () => {
    // GET request for remote image in node.js
    console.log('request begin..')
    axios({
        method:'get',
        url: api_url,
        responseType: 'json'
      })
      .catch(error => {
        console.log('Error requesting from api: ')
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
      })
      .then(response => {
            //console.log(json.data)
            if(!response) return
            console.log(response.data.result.fields)
            //io.emit('activity', response.data)
      })
}
    

server.listen(3000, () => {
  console.log('listening on *:3000');
});


