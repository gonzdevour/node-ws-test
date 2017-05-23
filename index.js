var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

wss.on("connection", function(ws) {

  ws.send("websocket connection open")
  // Request UserList
  wss.clients.forEach(function each(client) {
        client.send("RequestUserList");
  });

  ws.on("message", function incoming(data) {
    // Broadcast to everyone else.
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
  });
  
  ws.on("close", function() {
    console.log("websocket connection close")
  })
})
