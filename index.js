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
let scores = {};

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

function getConnectedLdaps() {
  let ldaps = [];
  for (let i = 0; i < Object.keys(team).length; i++) {
    let ldap = Object.keys(team)[i];
    for (let j = 0; j < Object.keys(clients).length; j++) {
      const clientId = Object.keys(clients)[j];
      if (!!clients[clientId].ldap && clients[clientId].ldap === ldap) {
        ldaps.push(ldap);
      }
    }
  }
  return ldaps;
}

function broadcast(obj, evenIfNotIdentified) {
  for (const [clientId, clientInfo] of Object.entries(clients)) {
    if (!!clientInfo.ldap || evenIfNotIdentified) {
      // Don't send the board if the client hasn't identified themselves yet,
      // unless the corresponding flag is true.
      // sendBoard(clientInfo.connection);
      clientInfo.connection.send(JSON.stringify(obj));
    }
  }
}

function getBoard() {
  const connectedLdaps = getConnectedLdaps();
  for (let ldap of connectedLdaps) {
    if (!scores.hasOwnProperty(ldap)) {
      scores[ldap] = 0;
    }
  }
  return  {
    'method': 'board',
    'scores': scores
  };
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
    if (result.method === 'whoami') {
      console.log('This client says they are: ' + result.payload);
      clients[clientId].ldap = result.payload;
      const board = getBoard();
      broadcast(board, false);
    }
    if (result.method === 'new-question') {
      broadcast({'method': 'new-question'}, false);
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
