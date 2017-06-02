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
    var g = JSON.stringify(k);
    var t = p['Type'];
    var r = p['Receiver'];
      // Message as command package
      if (r == "Server") {
          if (t == "JoinRoom") {
              // Register UserInfo(JSON) to server.
              UserInfo[clients.indexOf(ws)] = k
              ws.send(JSON.stringify("-start-"));
              ws.send(JSON.stringify(k));
              ws.send(JSON.stringify(k[2]));
              ws.send(JSON.stringify("-end-"));
              u = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Refresh_Roommates\","+ UserInfo +"]"};
              y = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Roommates_Join\","+ UserInfo[clients.indexOf(ws)] +"]"};
              wss.clients.forEach(function each(client) {
                // check if the clients are roomates.
                if (client.readyState === client.OPEN && UserInfo[clients.indexOf(client)]['Room'] === k['Room']) {
                    if (client !== ws) {
                    client.send(JSON.stringify(y));
                    } else {
                    client.send(JSON.stringify(u));
                    }
                }
              });   
          } else if (t == "RefreshRoommates") {
              // Send Roommates UserInfo to me.
              u = { "LTD":"com.playone.chat","Game":"","Pkg":"[\"Refresh_Roommates\","+ UserInfo +"]"};
              ws.send(JSON.stringify(u));
          } else {
          }
      } else if (r == "Public") {
          // Broadcast to everyone.
          wss.clients.forEach(function each(client) {
              client.send(g);
          });
      } else {
          // Private message.
          clients[r].send(g);
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
