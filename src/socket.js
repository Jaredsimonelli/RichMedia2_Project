var io;
var character = {lastUpdate: new Date().getTime(),x: 0,y: 0,points: 0,type: null};
var collectables = {};
/*var clients       = {};
var clientCounter = 0; // Increases per client connection*/

var configureSockets = function (socketio) {
    io = socketio;

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
};

module.exports.configureSockets = configureSockets;