
/**
 * Module dependencies.
 */

var
	express = require('express'),
	ECT = require('ect'),
	http = require('http'),
	path = require('path'),
	redis = require('redis'),
	publisherClient = redis.createClient();

var maxAge = 1000 * 60 * 60 * 24 * 365;
var app = express();
var ectRenderer = ECT({
	watch: true,
	ext: '.ect',
	root: __dirname + '/views'
});



// all environments
app.set('port', process.env.PORT || 1337);
app.set('views', __dirname + '/views');
app.engine('ect', ectRenderer.render);
app.set('view engine', 'ect');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}
// Log History --------------------------------------------------
var logHistory = {};
var logHistoryLimit = 200;


// Routes -------------------------------------------------------

app.get('/', function(req, res){
	var users = Object.keys(logHistory);
	res.render('index', {
		title: 'Log Center',
		filters: [{
			id: 'info',
			label: 'Info'
		},{
			id: 'warning',
			label: 'Warning'
		},{
			id: 'error',
			label: 'Error'
		}],
		users: users
	});
});

app.get('/log-center/stream/:user/:app', function(req, res) {
	// req.socket.setTimeout(Infinity);
	var messageCount = 0;
	var subscriber = redis.createClient();
	var user = req.params.user;
	var app = req.params.app;

	subscriber.subscribe('log');
	subscriber.subscribe('new-user');
	subscriber.subscribe('new-app');

	subscriber.on('error', function(e) {
	  console.log('Redis Error: ' + e.stack);
	});

	subscriber.on('message', function(channel, message) {
		var data = JSON.parse(message);
		if (channel === 'log' && data.user === user && data.app === app) {
			var id = logHistory[data.user][data.app].length;
			res.write('id: ' + id + '\n');
			res.write("data: " + message + '\n\n');
		} else if (channel === 'new-app' && data.user === user) {
			res.write('event: ' + data.event + '\n');
			res.write("data: " + message + '\n\n');
		} else if (channel === 'new-user') {
			res.write('event: ' + data.event + '\n');
			res.write("data: " + message + '\n\n');
		}
	});

	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	res.write('\n');

	if (!req.headers['last-event-id']) {
		if (logHistory[user] !== undefined && logHistory[user][app] !== undefined) {
			var history = logHistory[user][app];
			for (var i = 0, m; m = history[i]; i++) {
				res.write('id: ' + (i + 1) + '\n');
				res.write("data: " + m + '\n\n');
			}
		}
	}

	req.on('close', function() {
		subscriber.unsubscribe();
		subscriber.quit();
	});
});

app.get('/log-center/users', function(req, res) {
	var users = Object.keys(logHistory);
	res.send(JSON.stringify(users));
});

app.get('/log-center/:user/apps', function(req, res) {
	if (logHistory[req.params.user] === undefined) {
		res.send(JSON.stringify([]));
	} else {
		var apps = Object.keys(logHistory[req.params.user]);
		res.send(JSON.stringify(apps));
	}
});

app.all('/log', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	var
		data = req.body,
		app = data.app,
		user = data.user,
		jsonData = JSON.stringify(data);

	console.log(data);
	if (user === undefined) {
		user = 'global';
	}

	if (logHistory[user] === undefined) {
		publisherClient.publish('new-user', JSON.stringify({
			'event': 'adduser',
			'user': user
		}));
		logHistory[user] = {};
	}
	if (logHistory[user][app] === undefined) {
		publisherClient.publish('new-app', JSON.stringify({
			'event': 'addapp',
			'user': user,
			'app': app
		}));
		logHistory[user][app] = [];
	}
	if (logHistory[user][app].length === logHistoryLimit) {
		logHistory[user][app].shift();
	}
	logHistory[user][app].push(jsonData);

	publisherClient.publish('log', jsonData);
	res.end();
});
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
