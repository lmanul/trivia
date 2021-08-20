const http = require('http');
const app = require('express')();
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.listen(7070, () => { console.log('Listening on 7070'); });
const WebSocketServer = require('websocket').server
const httpServer = http.createServer();

httpServer.listen(7071, () => { console.log('Listening on port 7071'); })

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
    const result = JSON.parse(message.utf8Data);
    console.log(result);
  });

  const nClients = Object.keys(clients).length;
  const clientId = 'id-' + nClients;
  clients[clientId] = {
    'connection': connection,
    // First client is the master
    'master': (nClients === 0)
  };
  const payload = {
    'method': 'connect',
    'clientId': clientId,
    'master': clients[clientId].master
  };

  connection.send(JSON.stringify(payload));
});
