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
var RoomsArr = [];
var LoginCnt = 0;

// Function
var CreateRoom = function(ws, loginpkg, userid, roomname,userlimit,username) {
      // set properties of my ws
      ws.loginpkg = loginpkg
      ws.userid = userid
      // Modify Room data.
      if (!Rooms[roomname]) {
	  Rooms[roomname] = {};
	  Rooms[roomname].Roomname = roomname;
	  Rooms[roomname].wsgroup = [];
	  Rooms[roomname].wsgroup.push(ws);
	  Rooms[roomname].UserCnt = 1;
	  Rooms[roomname].UserLimit = userlimit;
	  Rooms[roomname].Hostname = username;
	  RoomsArr.push(roomname);
	  JoinRoomAccept(ws,roomname);
      } else { 
	  JoinRoomRefuse(ws,"exist");
      }
};

// Function
var JoinRoom = function(ws, loginpkg, userid, roomname,userlimit,username) {
      // set properties of my ws
      ws.loginpkg = loginpkg
      ws.userid = userid
      // Modify Room data.
      if (!Rooms[roomname]) {
	  Rooms[roomname] = {};
	  Rooms[roomname].Roomname = roomname;
	  Rooms[roomname].wsgroup = [];
	  Rooms[roomname].wsgroup.push(ws);
	  Rooms[roomname].UserCnt = 1;
	  Rooms[roomname].UserLimit = userlimit;
	  Rooms[roomname].Hostname = username;
	  Rooms[roomname].State = "Open";
	  RoomsArr.push(roomname);
	  JoinRoomAccept(ws,roomname);
      } else {
          if (!!ws.room && ws.room == roomname ) {
		JoinRoomRefuse(ws,"sameroom");
          } else {
		var s = Rooms[roomname].UserCnt + 1;
		if (s > userlimit) {
			JoinRoomRefuse(ws,"overload");
		} else {
			Rooms[roomname].wsgroup.push(ws);
			Rooms[roomname].UserCnt = Rooms[roomname].UserCnt + 1;
			JoinRoomAccept(ws,roomname);
		}
	  }
      }
};

// Function:
var JoinRoomAccept = function(ws,roomname) {
      ws.room = roomname
      // Build FunctionPackage for ws
      var FnPkg_JA = [];
      FnPkg_JA[0] = "JoinRoomAccepted"
      FnPkg_JA[1] = ws.loginpkg
      FnPkg_JA[2] = roomname
      z = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_JA)};
      ws.send(JSON.stringify(z));
      RefreshRoommateList(ws,roomname);
};

// Function:
var RefreshRoommateList = function(ws,roomname) {
      // Build FunctionPackage for ws
      var FnPkg_WS = [];
      FnPkg_WS[0] = "Roommates_Join"
      FnPkg_WS[1] = ws.loginpkg
      y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
      Rooms[roomname].wsgroup.forEach(function each(client) {
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
};

// Function:
var JoinRoomRefuse = function(ws,reason) {
      // Build FunctionPackage for ws
      var FnPkg_WS = [];
      FnPkg_WS[0] = "Roommates_Refused"
      FnPkg_WS[1] = reason
      y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
      ws.send(JSON.stringify(y));
};

// Function:
var RefreshRoomsList = function(ws) {
	RoomsArr.forEach(function each(roomname) {
		// Show me RoomsList
		// Build FunctionPackage
		var p = {};
		p["RoomName"] = roomname;
		p["UserCnt"] = Rooms[roomname].UserCnt;
		p["UserLimit"] = Rooms[roomname].UserLimit;
		p["State"] = Rooms[roomname].State;
		p["HostName"] = Rooms[roomname].Hostname
		var FnPkg = [];
		FnPkg[0] = "RefreshRoomsList";
		FnPkg[1] = JSON.stringify(p);
		FnPkg[2] = roomname;
		FnPkg[3] = Rooms[roomname].UserCnt;
		FnPkg[4] = Rooms[roomname].UserLimit;
		FnPkg[5] = Rooms[roomname].State;
		FnPkg[6] = Rooms[roomname].Hostname
		u = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg)};
		ws.send(JSON.stringify(u));
	});
};

// Function:
var LeaveRoom = function(ws,roomname,reason) {
	    //var n = ws.room;
	    var indexR = Rooms[roomname].wsgroup.indexOf(ws);
	    // Build FunctionPackage for ws
	    var FnPkg_WS = [];
	    FnPkg_WS[0] = "Roommates_Leave"
	    FnPkg_WS[1] = ws.loginpkg
	    FnPkg_WS[2] = reason	
	    y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
	    // Broadcast Leaving message to everyone else.
	    Rooms[roomname].wsgroup.forEach(function each(client) {
		// check if the clients are roomates.
		if (client.readyState === client.OPEN) {
		  client.send(JSON.stringify(y));
		}
	    });
	    //Delete Room data. 
	    Rooms[roomname].wsgroup.splice(indexR, 1);
	    Rooms[roomname].UserCnt = Rooms[roomname].UserCnt - 1;
	    if (Rooms[roomname].UserCnt == 0) {
		delete Rooms[roomname];
	    	RoomsArr.splice(RoomsArr.indexOf(roomname), 1);
	    }
};

// Function:
var LockRoom = function(ws,roomname,reason) {
	Rooms[roomname].State = "Locked";
	RefreshRoomsList(ws);
	// Build FunctionPackage for each client
	var FnPkg_WS = [];
	FnPkg_WS[0] = "RoomLocked"
	FnPkg_WS[1] = reason
	y = { "LTD":LTD_ID,"Game":Game_Name,"Pkg":JSON.stringify(FnPkg_WS)};
	// Broadcast Lockroom message to everyone else.
	Rooms[roomname].wsgroup.forEach(function each(client) {
		// check if the clients are roomates.
		if (client.readyState === client.OPEN) {
		  client.send(JSON.stringify(y));
		}
	});
};

// Function:
var SystemMessage = function(ws,msg) {
          // Broadcast to everyone.
          wss.clients.forEach(function each(client) {
              // check if the clients are roomates.
              if (client.readyState === client.OPEN && client.room === ws.room) {
                  client.send(JSON.stringify(msg));
              }
          });
};

// Function:
var PublicMessage = function(ws,msg) {
          // Broadcast to everyone.
          Rooms[ws.room].wsgroup.forEach(function each(client) {
              // check if the clients are roomates.
              if (client.readyState === client.OPEN && client.room === ws.room) {
                  client.send(JSON.stringify(msg));
              }
          });
};

// Function:
var PrivateMessage = function(ws,receiverid,msg) {
          // Private message.
          Rooms[ws.room].wsgroup.forEach(function each(client) {
              // check if the clients are roomates.
              if (client.readyState === client.OPEN) {
		if (client.userid === receiverid) {
			client.send(JSON.stringify(msg));
			if (client !== ws) {
				ws.send(JSON.stringify(msg));
			}
		}
              }
          });
};

// Events
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
    var t = p['Type'];
    var r = p['Receiver'];
    var m = p['Room'];
    var l = p['UserLimit'];	
    var d = p['UserID']
    var n = p['Name']
      // Message as command package
      if (r == "Server") {
          if (t == "CreateRoom") {
		CreateRoom(ws,k,d,m,l,n);
          } else if (t == "JoinRoom") {
		JoinRoom(ws,k,d,m,l,n);
          } else if (t == "RefreshRoomsList") {
		RefreshRoomsList(ws);
          } else if (t == "RefreshRoommateList") {
		RefreshRoommateList(ws,m);		  
          } else if (t == "LeaveRoom") {
		LeaveRoom(ws,m,"request");
          } else if (t == "LockRoom") {
		LockRoom(ws,m,"request");
          } else {
	  }
      } else if (r == "System") {
		SystemMessage(ws,p);
      } else if (r == "Public") {
		PublicMessage(ws,p);
      } else {
		PrivateMessage(ws,r,p);
      }
  });
  
  ws.on("close", function() {
	// Notice that if you didn't join any chatroom, ws.room is null.
  	// You have to check your variable null or not before manipulating them to prevent your server broken.
	if (!!ws.room) {
		LeaveRoom(ws,ws.room,"LeftGame");
	}
    //Clean
    var index = clients.indexOf(ws);
    clients.splice(index, 1);
    console.log("websocket connection close")
    clearInterval(id)
  })
})
