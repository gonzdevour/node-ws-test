var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

ws.send("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
ws.send("websocket server created")

wss.on("connection", function(ws) {
  var id = setInterval(function() {
    ws.send("something")

  ws.send("websocket connection open")

  ws.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  })
})
