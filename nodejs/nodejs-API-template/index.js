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
const apiKeyLightning = '513232a7-850e-4837-b73e-d1b445baa84d'
const apiKeyMeteo = '42b0ca74-42a2-476a-9abf-b47f3dd9bfd7'

 const getActivity = () => {
    // GET request for remote image in node.js
    axios({
        method: 'get',
        url: 'https://wfs-kbhkort.kk.dk/k101/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=k101:station_oversigtskort&outputFormat=json&SRSNAME=EPSG:4326',
        //        url: 'https://dmigw.govcloud.dk/v2/lightningdata',
        responseType: 'json',
        headers: {
          'X-Gravitee-Api-Key' : '42b0ca74-42a2-476a-9abf-b47f3dd9bfd7'
        }
      })
        .then(json => {
            //console.log(json.data)
            io.emit('activity', json.data)
        })
}
    

server.listen(3000, () => {
  console.log('listening on *:3000');
});


