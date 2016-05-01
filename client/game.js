
"use strict";

var canvas;
var ctx;
/*var width = window.innerWidth;
var height = window.innerHeight;*/
var speed;
var up,down,left,right;
var gameScreen = false;

//User data
var user = 'user' + (Math.floor((Math.random()*1000)) + 1);
var userName;
var userLevel;
var prevPoints;
var draws = {};
var collectables = {};

//our websocket connection
var socket; 

//redraw our square to the screen
function redraw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	//For text style
	var keys = Object.keys(draws);
	var cKeys = Object.keys(collectables);
	
	//Draw Collectables
	for(var i = 0; i < cKeys.length; i++)
	{
		//Draw Collectables
		var dColl = collectables[ cKeys[i] ];
		
		//Collectable color
		ctx.strokeStyle = 'green';
		
		//Draw 
		ctx.beginPath();
		ctx.arc(dColl.x, dColl.y, 10, 0, 2*Math.PI);
		ctx.stroke();
	}	
	
	//Draw Players
	for(var i = 0; i < keys.length; i++)
	{
		var drawCall = draws[ keys[i] ];
		
		//Text color
		ctx.font = "10px Verdana";
		ctx.fillStyle = drawCall.color;
		ctx.lineWidth = 3;
		ctx.fillText(drawCall.name + "   " + drawCall.level, drawCall.x, drawCall.y - 10);
		//Player
		ctx.fillRect(drawCall.x, drawCall.y, drawCall.width, drawCall.height);
		
		//Print Score
		ctx.font = "15px Verdana";
		ctx.fillText(drawCall.name + ": " + drawCall.points, 5, 25 + (i * 25)); 
		//console.log(drawCall.name + ':  ' + drawCall.points);
	}	
}

//Draw level progress bar (LPB)
function drawLPB(width){
	
	ctx.fillStyle = '#ffcc00';
	ctx.fillRect(0, 485, width, 15);	
}

function init() {
	canvas = document.querySelector("#canvas");
	ctx = canvas.getContext("2d");
	
	//Movement variables
	speed = 2.5;
	up = false;
	down = false;
	right = false;
	left = false;
	
	//Give an init position
	var x = 200;
	var y = 200;
	
	//SetCall function
	function moveCalls(){
		//Click coords
		if(up){y = y - speed;}
		if(down){y = y + speed;}
		if(left){x = x - speed;}
		else if(right){x = x + speed;}
		
		//Update draws array
		var time = new Date().getTime();
		draws[userName].lastUpdate = time;
		draws[userName].x = x;
		draws[userName].y = y;
		
		//Emit
		socket.emit('mover', { name: userName, playInfo: draws[userName]});
		socket.emit('checkCollisions', draws[userName]);
	}
	
	function setUp(){
		var time = new Date().getTime();
		
		//Get character data
		var charDataName = document.getElementById('characterName');
		var charDataLevel = document.getElementById('characterLevel');
		
		userName = charDataName.innerText;
		userLevel = parseInt(charDataLevel.innerText);
		prevPoints = 0;
		
		draws[userName] = {lastUpdate: time, x: x, y: y, width: 50, height: 50, color: "black", name: userName, level: userLevel, points: 0, collision: false};
	}
	
	//HandleMessage function
	function handleMessage(data)
	{	
		//If draws at index data.name is null add data, else update data
		if( !draws[data.playInfo.name] )
		{
			draws[data.playInfo.name] = {lastUpdate: data.playInfo.lastUpdate, x: data.playInfo.x, y: data.playInfo.y, width: 50, height: 50, color: "red", name: data.playInfo.name, level: data.playInfo.level, points: 0, collision: false};
		}
		else
		{
			draws[data.playInfo.name].x = data.playInfo.x;
			draws[data.playInfo.name].y = data.playInfo.y;
			draws[data.playInfo.name].points = data.playInfo.points;
			draws[data.playInfo.name].level = data.playInfo.level;
			
		}

		redraw();
	}
	
	//Handles the collectable data
	function handleCollectables(data){
		collectables = data.collInfo;			
	}
	
	function handleCollision(data){
		collectables = data.collInfo;	
		//console.log(data);
		
		draws[data.playInfo.name].level = data.playInfo.level;
		draws[data.playInfo.name].points = data.playInfo.points;
		draws[data.playInfo.name].collision = data.playInfo.collision;

		drawLPB(data.LPBInfo);
		
		//If there was a collision update progress bar
		/*if(draws[data.playInfo.name].collision){	
			drawLPB(draws[data.playInfo.name].level, draws[data.playInfo.name].points, data.playInfo.name);
		}*/
	}
	
	//Checks for key down input
	document.addEventListener('keydown', function(event) {			
		//if "W" or Up Arrow was pressed
		if(event.keyCode == 87 || event.keyCode == 38) {up = true;}
		//if "A" or Left Arrow was pressed
		if(event.keyCode == 65 || event.keyCode == 37) {left = true;}
		//if "S" or Down Arrow was pressed
		if(event.keyCode == 83 || event.keyCode == 40) {down = true;}
		//if "D" or Right Arrow was pressed
		if(event.keyCode == 68 || event.keyCode == 39) {right = true;}
		//if "enter" is pressed
		if(event.keyCode == 13) {gameScreen = true;}
		
		moveCalls();
		
	});
	
	//Checks for key up input
	document.addEventListener('keyup', function(event) {
		//if "W" or Up Arrow is up
		if(event.keyCode == 87 || event.keyCode == 38) {up = false;}
		//if "A" or Left Arrow is up
		if(event.keyCode == 65 || event.keyCode == 37) {left = false;}
		//if "S" or Down Arrow is up
		if(event.keyCode == 83 || event.keyCode == 40) {down = false;}
		//if "D" or Right Arrow is up
		if(event.keyCode == 68 || event.keyCode == 39) {right = false;}
		
		moveCalls();
	});
	
	//Checks for closed window
	document.addEventListener('onunload', function(event) {
		socket.emit('disconnect');
	});


	//Connect to our server (io added automatically by socket.io when embedding it in the HTTP app on the server side)
	//This will return a new websocket connection. Every call to io.connect will return a new websocket connection 
	//BUT not necessarily close the existing one. 
	//You can absolutely use multiple websockets on the client, but you have to manage which ones are listening to which
	//messages. In cases like this, you only need one. 
	socket = io.connect();
	
	
	
	//When the socket connects successfully
	socket.on('connect', function () {
		//Setup the first time user connects, also draw
		setUp();
		
		//Start Screen code
		/*if(gameScreen ==  false)
		{
			drawMainMenu();
			socket.emit('setUp');
		}
		else
		{	
			redraw();
		}*/
		
		socket.emit('setUp');
		redraw();
		
		//Emit (Commented out for main menu test
		//socket.emit('mover', { name: user, info: draws[user] });
	});      
	
	//When our socket receives 'moveCharacter' messages from the server, call our handleMessage function
	socket.on('moveCharacter',handleMessage);
	socket.on('setUpCollectables', handleCollectables);
	socket.on('collisionDetect', handleCollision);
	
	
	//Get mouse position
	/*canvas.addEventListener('click', function(evt) {
		var mousePos = getMousePos(canvas, evt);
		x = mousePos.x;
		y = mousePos.y;
		
		setCalls();
		
	}, false);
	
	function getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
		  x: evt.clientX - rect.left,
		  y: evt.clientY - rect.top
		};
	}*/
	
}

window.onload = init;