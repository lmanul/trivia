const http = require("http");
const WebSocketServer = require('websocket').server
const httpServer = http.createServer();

httpServer.listen(8080, () => { console.log('Listening on port 8080'); })

const clients = {};

const wsServer = new WebSocketServer({
  'httpServer': httpServer
});

wsServer.on('request', request => {
  console.log('On request');
  const connection = request.accept(null, request.origin);
  connection.on('open', () => { console.log('Opened'); });
  connection.on('close', () => { console.log('Closed'); });
  connection.on('message', message => {
    console.log('Got message');
    console.log(message);
  });

  // Generate a new client id
  const clientId = 'test';
  clients[clientId] = {
    'connection': connection
  };
});
