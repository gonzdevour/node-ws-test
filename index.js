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
var Rooms = {};
var LoginCnt = 0;

wss.on("connection", function(ws) {
  clients.push(ws);
  var id = setInterval(function() {
    d = JSON.stringify(new Date()), function() {  }
    //tell the clients how many users are currently online.
    t = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":"[\"Time\","+ d +"]","ClientLength":clients.length,"Log":"false"};
    ws.send(JSON.stringify(t), function() {  })
  }, 1000)
   
  //tell the client's UserID = LoginCnt
  LoginCnt = LoginCnt + 1;
  i = JSON.stringify(LoginCnt), function() {  }
  j = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":"[\"GetID\","+ i +"]"};
  ws.send(JSON.stringify(j));

  ws.on("message", function incoming(data) {
    var p = JSON.parse(data);
    var k = p['Pkg'];
    var a = JSON.parse(k);
    var g = JSON.stringify(k);
    var t = p['Type'];
    var r = p['Receiver'];
    var m = p['Room'];
    var d = p['UserID']
      // Message as command package
      if (r == "Server") {
          if (t == "JoinRoom") {
              // set properties of my ws
              ws.loginpkg = k
	      ws.userid = d
	      ws.room = m
ws.send(JSON.stringify("set properties of my ws"));
              // Modify Room data.
              if (!Rooms[m]) {
		  Rooms[m] = {};
                  Rooms[m].Roomname = m;
                  Rooms[m].UserCnt = 1;
ws.send(JSON.stringify("start push ws"));
		  Rooms[m].wsgroup = [];
		  Rooms[m].wsgroup.push(ws);
              } else { 
		  Rooms[m].wsgroup.push(ws);
                  Rooms[m].UserCnt = Rooms[m].UserCnt + 1;
              }
              // Build FunctionPackage for ws
              var FnPkg_WS = [];
              FnPkg_WS[0] = "Roommates_Join"
              FnPkg_WS[1] = ws.loginpkg
              y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
ws.send(JSON.stringify("start for each"));
              Rooms[m].wsgroup.forEach(function each(client) {
                if (client.readyState === client.OPEN) {
                    //tell roommates(except I) that I am joining.
                    if (client !== ws) {
                    client.send(JSON.stringify(y));
                    } 
                    //tell me who are my roommates(include I)
                    // Build FunctionPackage
                    var FnPkg_Client = [];
                    FnPkg_Client[0] = "Roommates_Join"
                    FnPkg_Client[1] = client.loginpkg
                    u = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_Client)};
                    ws.send(JSON.stringify(u));
                }
              });
          } else if (t == "RefreshRoomsList") {
              // Show me RoomsList
              // Build FunctionPackage
              var FnPkg = [];
              FnPkg[0] = "RefreshRoomsList"
              FnPkg[1] = Rooms
              u = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg)};
              ws.send(JSON.stringify(u));
          } else if (t == "LeaveRoom") {
		    var i = JSON.parse(ws.loginpkg);
		    var n = i['Room'];
		    // Build FunctionPackage for ws
		    var FnPkg_WS = [];
		    FnPkg_WS[0] = "Roommates_Leave"
		    FnPkg_WS[1] = ws.loginpkg
		    y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
		    // Broadcast Leaving message to everyone else.
		    Rooms[n].wsgroup.forEach(function each(client) {
			// check if the clients are roomates.
			if (client.readyState === client.OPEN && client.room === ws.room) {
			  client.send(JSON.stringify(y));
			}
		    });
		    //get room name, check if empty.
		    Rooms[n].UserCnt = Rooms[n].UserCnt - 1;
		    if (Rooms[n].UserCnt == 0) {
			delete Rooms[n];
		    }
		    ws.room = null
          } else {
	  }
      } else if (r == "System") {
          // Broadcast to everyone.
          wss.clients.forEach(function each(client) {
              // check if the clients are roomates.
              if (client.readyState === client.OPEN && client.room === ws.room) {
                  client.send(JSON.stringify(p));
              }
          });
      } else if (r == "Public") {
          // Broadcast to everyone.
          Rooms[m].wsgroup.forEach(function each(client) {
              // check if the clients are roomates.
              if (client.readyState === client.OPEN && client.room === ws.room) {
                  client.send(JSON.stringify(p));
              }
          });
      } else {
          // Private message.
          Rooms[m].wsgroup.forEach(function each(client) {
              // check if the clients are roomates.
              if (client.readyState === client.OPEN) {
		if (client.userid === r) {
			client.send(JSON.stringify(p));
			if (client !== ws) {
				ws.send(JSON.stringify(p));
			}
		}
              }
          });
      }
  });
  
  ws.on("close", function() {
	// Notice that if you didn't join any chatroom, ws.room is null.
  	// You have to check your variable null or not before manipulating them to prevent your server broken.
	if (!!ws.room) {
		var n = ws.room;
		var indexR = Rooms[n].wsgroup.indexOf(ws);

		// Build FunctionPackage for ws
		var FnPkg_WS = [];
		FnPkg_WS[0] = "Roommates_Leave"
		FnPkg_WS[1] = ws.loginpkg
		y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
		// Broadcast Leaving message to everyone else.
		Rooms[n].wsgroup.forEach(function each(client) {
			if (client !== ws && client.readyState === client.OPEN) {
				client.send(JSON.stringify(y));
			}
		});
		//Delete Room data. 
		Rooms[n].wsgroup.splice(indexR, 1);
		Rooms[n].UserCnt = Rooms[n].UserCnt - 1;
			if (Rooms[n].UserCnt == 0) {
				delete Rooms[n];
			}
	}
    //Clean
    var index = clients.indexOf(ws);
    clients.splice(index, 1);
    console.log("websocket connection close")
    clearInterval(id)
  })
})
