//SERVER TING 
//kommenter følgende linjer
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

const port = 3000;
app.use(express.static('public'))

server.listen(4000, () => {
  console.log('client available on on *:4000');
})

io.on('connection', (socket) => {
  console.log('a user connected')
  io.emit('ip', ip.address()+":"+port)
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
  console.log('UDP Socket is listening at: ' + address.address + ":" + 4000);
})

//Når den får en besked
udpSocket.on('message', (msg, info) => {  
  console.log('Data received from client : ' + msg.toString());
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
  io.emit('list', msg.toString())
})

//Hvis der skar en fejl
udpSocket.on('error', (err) => {
  console.log('socket error:\n' + err.stack);
  udpSocket.close()
});

// port, ip adresse, callback
udpSocket.bind(port,ip.address(),false);