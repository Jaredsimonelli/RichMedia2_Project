/*//get the HTTP module and create a server. This time we will store the returned server as "app"
var app = require('http').createServer(handler);
//grab socketio and pass in our server "app" to create a new socketio server running inside of our HTTP server
//Socket.io can also run individually, but in this case we want it to run with our webpages, so we will use the module's
//option to allow us to embed it
var io = require('socket.io')(app);
//grab our file system 
var fs = require('fs');*/

//import libraries 
var path = require('path'); 
var express = require('express'); 
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var compression = require('compression'); 
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser'); 
var bodyParser = require('body-parser'); 
var mongoose = require('mongoose'); 
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var url = require('url');
var csrf = require('csurf');
var socket = require('./socket.js');

var dbURL = process.env.MONGODB_URI || "mongodb://localhost/simpleMVCExample";

var db = mongoose.connect(dbURL, function(err) {
    if(err) {
        console.log("Could not connect to database");
        throw err;
    }
});

var redisURL = {
	hostname: 'localhost',
	port: 6379
};

var redisPASS;

if(process.env.REDISCLOUD_URL){
	redisURL = url.parse(process.env.REDISCLOUD_URL);
	redisPASS = redisURL.auth.split(":")[1];
}

//Pull in our router
var router = require('./router.js'); 

var port = process.env.PORT || process.env.NODE_PORT || 3000;

//var app = express();
app.use('/assets', express.static(path.resolve(__dirname, '../client/')));

socket.configureSockets(io);

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
	key: "sessionid",
	store: new RedisStore({
		host: redisURL.hostname,
		port: redisURL.port,
		pass: redisPASS
	}),
	secret: 'Domo Arigato',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: true
	}
}));

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(favicon(__dirname + '/../client/img/favicon.png'));
app.disable('x-powered-by');
app.use(cookieParser());

app.use(csrf());
app.use(function (err, req, res, next){
	if(err.code !== 'EBADCSRFTOKEN'){
		return next(err);
	}
	
	return;
});

router(app);

server.listen(port, function(err) {
    //if the app fails, throw the err 
    if (err) {
      throw err;
    }
    console.log('Listening on port ' + port);
});