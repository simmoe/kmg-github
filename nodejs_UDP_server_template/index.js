//dokumentation af dgram: https://nodejs.org/api/dgram.html

//npm install -s dgram
const udp = require('dgram')


var server = udp.createSocket('udp4')


//Når den er klar til at få beskeder
server.on('listening',function(){
  var address = server.address();
  var port = address.port;
  console.log('Server is listening at: ' +address.address+":" + port);
});

//Når en får en besked
server.on('message',function(msg,info){
  console.log('Data received from client : ' + msg.toString());
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
});

//Hvis der skar en fejl
server.on('error', (err) => {
  console.log('server error:\n' + err.stack);
  server.close()
});

// port, ip adresse, callback
server.bind(3001,'192.168.0.36',false);