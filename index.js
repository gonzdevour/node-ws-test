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

var clients = [];

wss.on("connection", function(ws) {
  clients.push(ws);
  var id = setInterval(function() {
    t = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Time\", new Date() ]"};
    ws.send(JSON.stringify(t), function() {  })
  }, 1000)
  
  ws.send("websocket connection open")
  
  var index = clients.indexOf(ws);
  wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(index), function() {  });
  });

  ws.on("message", function incoming(data) {
    // Broadcast to everyone else.
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
  });
  
  ws.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  })
})
