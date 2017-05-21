var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 8080 });

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};
