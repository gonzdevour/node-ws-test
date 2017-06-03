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
var UserInfo = [];

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
    var k = p['Pkg'];
    var a = JSON.parse(k);
    var g = JSON.stringify(k);
    var t = p['Type'];
    var r = p['Receiver'];
      // Message as command package
      if (r == "Server") {
          if (t == "JoinRoom") {
              // Register UserInfo(JSON) to server.
              UserInfo[clients.indexOf(ws)] = k
              y = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Roommates_Join\","+ UserInfo[clients.indexOf(ws)] +"]"};
              wss.clients.forEach(function each(client) {
                // check if the clients are roomates.
                var b = JSON.parse(UserInfo[clients.indexOf(client)])
                if (client.readyState === client.OPEN && b['Room'] === a['Room']) {
                    //tell roommates(except I) that I am joining.
                    if (client !== ws) {
                    client.send(JSON.stringify(y));
                    } 
                    //tell me who are my roommates(include I)
                    u = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Roommates_Join\","+ UserInfo[clients.indexOf(client)] +"]"};
                    ws.send(JSON.stringify(u));
                }
              });
          } else if (t == "RefreshRoommates") {
              wss.clients.forEach(function each(client) {
                // check if the clients are roomates.
                var b = JSON.parse(UserInfo[clients.indexOf(client)])
                if (client.readyState === client.OPEN && b['Room'] === a['Room']) {
                    //tell me who are my roommates(include I)
                    u = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Roommates_Join\","+ UserInfo[clients.indexOf(client)] +"]"};
                    ws.send(JSON.stringify(u));
                }
              });
          } else {
          }
      } else if (r == "Public") {
          // Broadcast to everyone.
          wss.clients.forEach(function each(client) {
              // check if the clients are roomates.
              var b = JSON.parse(UserInfo[clients.indexOf(client)])
              if (client.readyState === client.OPEN && b['Room'] === a['Room']) {
                  client.send(JSON.stringfy(p));
              }
          });
      } else {
          // Private message.
          clients[r].send(JSON.stringfy(p));
      }
  });
  
  ws.on("close", function() {
    var index = clients.indexOf(ws);
    // Broadcast Leaving message to everyone else.
    y = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Roommates_Leave\","+ UserInfo[index] +"]"};
    wss.clients.forEach(function each(client) {
        if (client !== ws) {
        client.send(JSON.stringify(y));
        }
    });
    clients.splice(index, 1);
    UserInfo.splice(index, 1);
    console.log("websocket connection close")
    clearInterval(id)
  })
})
