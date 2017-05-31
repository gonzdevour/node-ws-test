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
    d = JSON.stringify(new Date()), function() {  }
    t = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Time\","+ d +"]","ClientLength":clients.length,"Log":"false"};
    ws.send(JSON.stringify(t), function() {  })
  }, 1000)
    
  var index = clients.indexOf(ws);
  i = JSON.stringify(index), function() {  }
  j = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"GetID\","+ i +"]"};
  ws.send(JSON.stringify(j));

  ws.on("message", function incoming(data) {
    var p = JSON.parse(data);
    var r = JSON.stringify(p['Receiver']);
    var g = JSON.stringify(p['Pkg']);
      if (p['Receiver'] == "Public") {
          // Broadcast to everyone.
          wss.clients.forEach(function each(client) {
              client.send(g);
          });
      } else {
          private = clients[number(r)]
          private.send(g);
      }
  });
  
  ws.on("close", function() {
    var index = clients.indexOf(ws);
    clients.splice(index, 1);
    console.log("websocket connection close")
    clearInterval(id)
  })
})
