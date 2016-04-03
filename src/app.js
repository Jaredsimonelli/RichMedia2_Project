//get the HTTP module and create a server. This time we will store the returned server as "app"
var app = require('http').createServer(handler);
//grab socketio and pass in our server "app" to create a new socketio server running inside of our HTTP server
//Socket.io can also run individually, but in this case we want it to run with our webpages, so we will use the module's
//option to allow us to embed it
var io = require('socket.io')(app);
//grab our file system 
var fs = require('fs');

//get the PORT for the server
//Remember we use process.env.PORT or process.env.NODE_PORT to check if we are running on a server
//that already has set ports in the environment configuration
var PORT = process.env.PORT || process.env.NODE_PORT || 3000;

//tell your server to listen on the port
app.listen(PORT);

var character = {
	lastUpdate: new Date().getTime(),
    x: 0,
	y: 0,
	points: 0,
	type: null
};

var collectables = {};


//Our HTTP server handler. Remember with an HTTP server, we always receive the request and response objects
function handler (req, res) {
  //read our file ASYNCHRONOUSLY from the file system. This is much lower performance, but allows us to reload the page
  //changes during development. 
  //First parameter is the file to read, second is the callback to run when it's read ASYNCHRONOUSLY
  fs.readFile(__dirname + '/../client/index.html', function (err, data) {
    //if err, throw it for now
    if (err) {
      throw err;
    }

    //otherwise write a 200 code and send the page back
    //Notice this is slightly different from what we have done in the past. There is no reason for this, just to keep it simple.
    //There are multiple ways to send things in Node's HTTP server module. The documentation will show the optional parameters. 
    res.writeHead(200);
    res.end(data);
  });
}

/** Now we need to code our web sockets server. We are using the socket.io module to help with this. 
    This server is a SEPARATE server from our HTTP server. They are TWO DIFFERENT SERVERS. 
    That said, socket.io allows us to embed our websockets server INSIDE of our HTTP server. That will allow us to
    host the socket.io libraries on the client side as well as handle the websocket port automatically. 
**/
//When new connections occur on our socket.io server (we receive the new connection as a socket in the parameters)
io.on('connection', function (socket) {

  //join that socket to a hard-coded room. Remember rooms are just a collection of sockets. A socket can be in none, one or many rooms. 
  //A room's name is just a string identifier. It can be anything you make. If the room exists when you add someone, it adds them to the room.
  //If the room does not exist when you add someone, it creates the room and adds them to it. 
  socket.join('room1');

  
  socket.on('mover', function(data){
		
	character.x = data.playInfo.x;
	character.y = data.playInfo.y;
	character.name = data.name;
	character.type = data.playInfo.type;
	character.points = data.playInfo.points;
	
	//console.log(character);
	
	socket.emit('moveCharacter', {playInfo: character});
	socket.broadcast.to('room1').emit('moveCharacter', {playInfo: character}); 
  });
  
  
  
  socket.on('setUp', function(data) {
	for(var i = 0; i < 10; i++){
		collectables[i] = {x: Math.floor((Math.random()*450)) + 1, y: Math.floor((Math.random()*450)) + 1};
	}
	
	socket.emit('setUpCollectables', {collInfo: collectables});
	socket.broadcast.to('room1').emit('setUpCollectables', {collInfo: collectables}); 
	
  });
  
  
  socket.on('checkCollisions', function(data) {
	
	character.name = data.name;
	
	for(var i = 0; i < 10; i++){		
		var x = collectables[i].x;
		var y = collectables[i].y;	
		
		if(x < data.x + data.width && x + 10 > data.x && y < data.y + data.height && y + 10 > data.y){
			data.points++;
			character.points = data.points;
			collectables[i] = {x: Math.floor((Math.random()*450)) + 1, y: Math.floor((Math.random()*450)) + 1};
		}
	}
	
	
	socket.emit('collisionDetect', {playInfo: character, collInfo: collectables});
	socket.broadcast.to('room1').emit('collisionDetect', {playInfo: character, collInfo: collectables}); 

  });
  
  //When the user disconnects, remove them from the room (since they are no longer here)
  //The socket is maintained for a bit in case they reconnect, but we do want to remove them from the room
  //Since they are currently disconnected.
  socket.on('disconnect', function(data) {
	//console.log(data.playInfo.name + ' has left the room');
    socket.leave('room1');
  });
  
});

console.log("listening on port " + PORT);