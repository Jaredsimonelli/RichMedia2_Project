var io;
var character = {lastUpdate: new Date().getTime(),x: 0,y: 0, color: "black", points: 0,level: 0, collision: false, prevLvlExp: 0};
var users = {};
var collectables = {};
var nLevel;
var nextLevelExp;

//var count = 0;
//var width = 0;
/*var clients       = {};
var clientCounter = 0; // Increases per client connection*/

var configureSockets = function (socketio) {
    io = socketio;

    io.on('connection', function (socket) {
		socket.join('room1');
		/*users[socket] = character;
		leave(socket);*/
		
		//MOVER
		//Get character data and move them
		socket.on('mover', function(data){
			//Gets and sets characters data
			character.name = data.name;
			character.x = data.playInfo.x;
			character.y = data.playInfo.y;
			character.level = data.playInfo.level;
			character.points = data.playInfo.points;
			character.color = data.playInfo.color;
			users[character.name] = character;
			
			/*var keys = Object.keys(users);
			users[socket] = character;
			console.log(keys.length);*/
			
			socket.emit('moveCharacter', {playInfo: character});
			socket.broadcast.to('room1').emit('moveCharacter', {playInfo: character}); 
		});
		
		//SETUP
		//Setup, sets the collectables up in random spots and charater array
		socket.on('setUp', function(data) {
			//SetUp users array
			var isUserIn = false; 
			var usersKeys = Object.keys(users);
			for(var i = 0; i < usersKeys.length; i++){
				if(usersKeys[i] == data.name){
					isUserIn = true;
				}					
			}
			//If the character isn't in the user array yet..add them
			if(!isUserIn){users[data.name] = data;}
			//users[socket] = data;
			
			//Set up collectables
			for(var i = 0; i < 10; i++){
				collectables[i] = {x: Math.floor((Math.random()*450)) + 1, y: Math.floor((Math.random()*450)) + 1};
			}
			
			socket.emit('setUpCollectables', {collInfo: collectables});
			socket.broadcast.to('room1').emit('setUpCollectables', {collInfo: collectables}); 
		});
		
		//COLLISION
		//This checks collisions between players and the collectables
		socket.on('checkCollisions', function(data) {
			character.name = data.name;
			
			for(var i = 0; i < 10; i++){		
				var x = collectables[i].x;
				var y = collectables[i].y;	
				
				if(x < data.x + data.w && x + 10 > data.x && y < data.y + data.h && y + 10 > data.y){
					data.points++;
					//count++;
					character.points = data.points;
					//character.collision = true;
					collectables[i] = {x: Math.floor((Math.random()*450)) + 1, y: Math.floor((Math.random()*450)) + 1};
				}
				
			}
			
			nLevel = data.level + 1;
			nextLevelExp = (25 * nLevel * (1 + nLevel)) / 10;
			
			//var count = data.points - prevLevelExp;
			var width = (800 / nextLevelExp) * (data.points - data.prevLvlExp);
			//console.log(data.prevLvlExp);
			
			if(data.points >= nextLevelExp){
				data.prevLvlExp = nextLevelExp;
				character.prevLvlExp = data.prevLvlExp;
				//count = 0;
				data.level++;
				character.level = data.level;
				//width = 0;
			}
			
			socket.emit('collisionDetect', {playInfo: character, collInfo: collectables, barWidth: width});
			socket.broadcast.to('room1').emit('collisionDetect', {playInfo: character, collInfo: collectables}); 
		});	
    });
};

//DISCONNECT
//Disconnect on leave
var leave = function(socket){
	socket.on('disconnect', function(data) {
		//console.log(data.playInfo.name + ' has left the room');
		//console.log(users[socket]);
		delete users[socket];
		socket.leave('room1');
		
	});
}

module.exports.configureSockets = configureSockets;