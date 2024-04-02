//kommenter følgende linjer
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)

//Socket io kommunikerer med hjemmesifden som hostes i /public
const { Server } = require("socket.io")
const io = new Server(server)


const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (key, data) => {
  if (data && data.name === 'up') {
    console.log('Up arrow pressed');

  } else if (data && data.name === 'down') {
    sendUdp('down')
    console.log('Down arrow pressed');
  } else if (data && data.name === 'left') {
    console.log('Left arrow pressed');
    sendUdp('left')
  } else if (data && data.name === 'right') {
    console.log('Right arrow pressed');
    sendUdp('right')
  } else if (key === '\u0003') {
    console.log('CTRL-C pressed, exiting...');
    process.exit();
  } else {
    console.log(`Key pressed: ${key}`);
  }
});

const port = 4444;
//hoster mappen /public på porten 
app.use(express.static('public'))

server.listen(port, () => {
  console.log('client available on on *:4444');
})

//når hjemmesiden er klar 
io.on('connection', (socket) => {
  console.log('a user connected')
  io.emit('ip', ip.address() + ":" + port)
})

//UDP TING
//dokumentation af dgram: https://nodejs.org/api/dgram.html

//npm install -s dgram
const udp = require('dgram')

//to get local ip
var ip = require('ip')

console.log(ip.address())

var udpSocket = udp.createSocket('udp4')


//Når den er klar til at få beskeder
udpSocket.on('listening', () => {
  var address = udpSocket.address()
  var port = address.port
  console.log('UDP Socket is listening at: ' + address.address + ":" + port);
})

//Når den får en besked
udpSocket.on('message', (msg, info) => {  
  //console.log('Data received from client : ' + msg.toString());
  //console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
  io.emit('udp-message', msg.toString())
})

//Hvis der skar en fejl
udpSocket.on('error', (err) => {
  console.log('socket error:\n' + err.stack);
  udpSocket.close()
});

// port, ip adresse, callback
udpSocket.bind(port,ip.address(),false);


const sendUdp = (message) => {
  udpSocket.send(message, port, ip.address(), (error) => {
    if (error) {
      console.error(error);
      udpSocket.close();
    } else {
      console.log('Message sent successfully');
      //udpSocket.close();
    }
  });
}