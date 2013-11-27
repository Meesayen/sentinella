
/**
 * Module dependencies.
 */

var
	express = require('express'),
	ECT = require('ect'),
	http = require('http'),
	path = require('path'),
	app = express(),
	server = http.createServer(app),
	io = require('socket.io').listen(server),
	MongoClient = require('mongodb').MongoClient;

var MAX_LOGS_PER_APP = 200;
var ADMIN_PASSWORD = 'legacyoflog';


var ectRenderer = ECT({
	watch: true,
	ext: '.ect',
	root: __dirname + '/views'
});


var mongoConf;
if (process.env.VCAP_SERVICES) {
	// Configuration needed by the AppFog PaaS
	io.configure(function () {
		io.set('transports', ['xhr-polling']);
		io.set('polling duration', 10);
	});
	var env = JSON.parse(process.env.VCAP_SERVICES);
	mongoConf = env['mongodb-1.8'][0]['credentials'];
} else {
	mongoConf = {
		'hostname': 'localhost',
		'port': 27017,
		'username': '',
		'password': '',
		'name': '',
		'db': 'log-center'
	};
}
var generateMongoUrl = function(obj) {
	obj.hostname = (obj.hostname || 'localhost');
	obj.port = (obj.port || 27017);
	obj.db = (obj.db || 'test');
	if (obj.username && obj.password) {
		return [
			'mongodb://',
			obj.username,
			':',
			obj.password,
			'@',
			obj.hostname,
			':',
			obj.port,
			'/',
			obj.db
		].join('');
	} else {
		return [
			'mongodb://',
			obj.hostname,
			':',
			obj.port,
			'/',
			obj.db
		].join('');
	}
}

var db;
MongoClient.connect(generateMongoUrl(mongoConf),
	{w:0, native_parser:true}, function(err, _db) {
	db = _db;
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

// Routes -------------------------------------------------------


app.get('/', function(req, res) {
	res.render('index', {
		title: 'Log Center'
	});
});

app.get('/clear/:user?*/:app?*', function(req, res) {
	if (req.query.pw && req.query.pw == ADMIN_PASSWORD) {
		var
			userId = req.params.user,
			appId = req.params.app;

		db.collection('users', function(err, users) {
			if (userId) {
				users.findOne({ name: userId }, function(err, user) {
					if (!err && user) {
						db.collection('apps', function(err, apps) {
							if (appId) {
								apps.findOne({
									_id: { '$in': user.apps },
									name: appId
								}, function(err, app) {
									if (!err && app) {
										app.logs = [];
										apps.save(app, {w:0});
										res.send(200);
									} else {
										res.send(err ? 500 : 404)
									}
								});
							} else {
								apps.find({
									_id: { '$in': user.apps }
								}).toArray(function(err, _apps) {
									if (!err && _apps && _apps[0]) {
										for (var i = 0, app; app = _apps[i]; i++) {
											app.logs = [];
											apps.save(app, {w:0});
										}
										res.send(200);
									} else {
										res.send(err ? 500 : 404);
									}
								});
							}
						});
					} else {
						res.send(err ? 500 : 404);
					}
				});
			} else {
				db.collection('apps', function(err, apps) {
					apps.find().toArray(function(err, _apps) {
						if (!err && _apps && _apps[0]) {
							for (var i = 0, app; app = _apps[i]; i++) {
								app.logs = [];
								apps.save(app, {w:0});
							}
							res.send(200);
						} else {
							res.send(err ? 500 : 404);
						}
					});
				});
			}
		});

		res.send(200);
	} else {
		res.send(403);
	}
});

io.sockets.on('connection', function(socket) {
	socket.on('console:connection', function(data) {
		var user = data.user;
		var app = data.app;

		if (user && app) {
			db.collection('users', function(err, users) {
				users.findOne({
					name: user
				}, { _id: false, apps: true }, function(err, _user) {
					if (_user) {
						db.collection('apps', function(err, apps) {
							apps.findOne({
								_id: { '$in': _user.apps },
								name: app
							}, { logs: true, _id: false }, function(err, _app) {
								if (_app) {
									for (var i = 0, m; m = _app.logs[i]; i++) {
										socket.emit('sentinel:new-log', JSON.parse(m));
									}
								}
							});
						});
					}
				});
			});
		}

		socket.on('disconnect', function() {
			console.log('DISCONNECTED');
		})
	});
});

app.get('/log-center/users', function(req, res) {
	db.collection('users', function(err, users) {
		if (req.query.username) {
			users.findOne({ name: req.query.username }, function(err, user) {
				if (user) {
					res.send(JSON.stringify({ exists: true }));
				} else {
					res.send(JSON.stringify({ exists: false }));
				}
			});
		} else {
			users.find({}, { _id: false, name: true }, function(err, users) {
				users.toArray(function(err, users) {
					var userNames = [];
					for (var i = 0, u; u = users[i]; i++) {
						userNames.push(u.name);
					};
					res.send(JSON.stringify(userNames));
				});
			});
		}
	});
});

app.get('/log-center/:user/apps', function(req, res) {
	db.collection('users', function(err, users) {
		users.findOne({
			name: req.params.user
		}, { _id: false, apps: true }, function(err, user) {
			if (!user) {
				res.send(JSON.stringify([]));
				return;
			}
			db.collection('apps', function(err, apps) {
				apps.find({
					_id: { '$in': user.apps }
				}, { name: true, _id: false }, function(err, apps) {
					apps.toArray(function(err, apps) {
						var appNames = [];
						for (var i = 0, a; a = apps[i]; i++) {
							appNames.push(a.name);
						};
						res.send(JSON.stringify(appNames));
					});
				});
			});
		});
	});
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

	if (user === undefined) {
		user = 'global';
	}

	db.collection('users', function(err, users) {
		users.findOne({ name: user }, function(err, _user) {
			if (!_user) {
				io.sockets.emit('sentinel:new-user', {
					'event': 'adduser',
					'user': user
				});
				_user = {
					name: user,
					apps: []
				}
				users.save(_user, {w:0});
			}
			db.collection('apps', function(err, apps) {
				apps.findOne({
					_id: { '$in': _user.apps },
					name: app
				}, function(err, _app) {
					if (!_app) {
						io.sockets.emit('sentinel:new-app', {
							'event': 'addapp',
							'user': user,
							'app': app
						});
						_app = {
							name: app,
							logs: []
						};
						apps.save(_app, {w:0});
						_user.apps.push(_app._id);
						users.save(_user, {w:0});
					}
					if (_app.logs.length === MAX_LOGS_PER_APP) {
						_app.logs.shift();
					}
					_app.logs.push(jsonData);
					apps.save(_app, {w:0});
					io.sockets.emit('sentinel:new-log', data);
				});
			});
		});
	});

	res.end();
});
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
