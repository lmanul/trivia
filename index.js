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
let team;

const wsServer = new WebSocketServer({
  'httpServer': httpServer,
  'maxReceivedFrameSize': 10 * 1024 * 1024,
  'maxReceivedMessageSize': 10 * 1024 * 1024, // 10 MB
});

function sendWelcome(clientId, connection) {
  const payload = {
    'method': 'connect',
    'clientId': clientId,
    'team': team,
    'master': clients[clientId].master
  };

  connection.send(JSON.stringify(payload));
}

wsServer.on('request', request => {

  const connection = request.accept(null, request.origin);
  connection.on('open', () => { console.log('Opened'); });
  connection.on('close', () => { console.log('Closed'); });
  connection.on('message', message => {
    const result = JSON.parse(message.utf8Data);
    console.log('Got message, method ' + result.method);
    if (result.method === 'team') {
      team = JSON.parse(result.payload);
      console.log('Got team info. ' + Object.keys(team).length + ' members');
      sendWelcome(clientId, connection);
    }
  });

  const nClients = Object.keys(clients).length;
  const clientId = 'id-' + nClients;
  console.log('Client connected: ' + clientId);
  clients[clientId] = {
    'connection': connection,
    // First client is the master
    'master': (nClients === 0)
  };

  sendWelcome(clientId, connection);
});
