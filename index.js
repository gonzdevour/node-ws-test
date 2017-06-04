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

//key to identify your own server and client.
var LTD_ID = "com.playone.chat"
var Game_Name = ""

//simple storage.
var clients = [];
var UserInfo = [];
var Rooms = {};

wss.on("connection", function(ws) {
  clients.push(ws);
  var id = setInterval(function() {
    d = JSON.stringify(new Date()), function() {  }
    //tell the clients how many users are currently online.
    t = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":"[\"Time\","+ d +"]","ClientLength":clients.length,"Log":"false"};
    ws.send(JSON.stringify(t), function() {  })
  }, 1000)
    
  var index = clients.indexOf(ws);
  i = JSON.stringify(index), function() {  }
  j = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":"[\"GetID\","+ i +"]"};
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
              // Modify Room data.
              // Build FunctionPackage for ws
              var FnPkg_WS = [];
              FnPkg_WS[0] = "Roommates_Join"
              FnPkg_WS[1] = UserInfo[clients.indexOf(ws)]
              y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
              wss.clients.forEach(function each(client) {
                // check if the clients are roomates.
                var b = JSON.parse(UserInfo[clients.indexOf(client)])
                if (client.readyState === client.OPEN && b['Room'] === a['Room']) {
                    //tell roommates(except I) that I am joining.
                    if (client !== ws) {
                    client.send(JSON.stringify(y));
                    } 
                    //tell me who are my roommates(include I)
                    // Build FunctionPackage
                    var FnPkg_Client = [];
                    FnPkg_Client[0] = "Roommates_Join"
                    FnPkg_Client[1] = UserInfo[clients.indexOf(client)]
                    u = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_Client)};
                    ws.send(JSON.stringify(u));
                }
              });
          } else if (t == "RefreshRoommates") {
              wss.clients.forEach(function each(client) {
                // check if the clients are roomates.
                var b = JSON.parse(UserInfo[clients.indexOf(client)])
                if (client.readyState === client.OPEN && b['Room'] === a['Room']) {
                    //tell me who are my roommates(include I)
                    // Build FunctionPackage
                    var FnPkg_Client = [];
                    FnPkg_Client[0] = "Roommates_Join"
                    FnPkg_Client[1] = UserInfo[clients.indexOf(client)]
                    u = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_Client)};
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
              if (client.readyState === client.OPEN && b['Room'] === p['Room']) {
                  client.send(JSON.stringify(p));
              }
          });
      } else {
          // Private message.
          clients[r].send(JSON.stringify(p));
      }
  });
  
  ws.on("close", function() {
    var index = clients.indexOf(ws);
    // Build FunctionPackage for ws
    var FnPkg_WS = [];
    FnPkg_WS[0] = "Roommates_Leave"
    FnPkg_WS[1] = UserInfo[index]
    y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
    // Broadcast Leaving message to everyone else.
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
