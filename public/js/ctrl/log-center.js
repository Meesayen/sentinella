// <pre>
//	log-center.js  1.0.0
//
//
//    _/_/_/  _/_/      _/_/      _/_/      _/_/_/    _/_/_/  _/    _/    _/_/    _/_/_/
//   _/    _/    _/  _/_/_/_/  _/_/_/_/  _/_/      _/    _/  _/    _/  _/_/_/_/  _/    _/
//  _/    _/    _/  _/        _/            _/_/  _/    _/  _/    _/  _/        _/    _/
// _/    _/    _/    _/_/_/    _/_/_/  _/_/_/      _/_/_/    _/_/_/    _/_/_/  _/    _/
//                                                              _/
//                                                         _/_/
//
//	(c) 2012 Federico Giovagnoli (meesayen)
//	Log Center may be freely distributed under the MIT license.
// </pre>

define([
	'lib/common',
	'lib/class',
	'lib/templates',
	'lib/dom-handler',

	'comp/app-list',
	'comp/user-carousel',
	'comp/console'
], function(
	x,
	Class,
	templates,
	DomHandler,

	AppList,
	UserCarousel,
	Console
) {

	var LogCenter = Class({
		parent: DomHandler,
		constructor: function() {
			this._root = document.body;
			this._sourceUrl = '/log-center/stream';
			this.user = null;
			this.objectMaps = [];
			this.logCenterPage = this.nodes.one('#log-center');
			this.console = new Console({
				hook: '#console'
			});
			this.appList = new AppList({
				hook: '#apps'
			});
			this.appList.on('item:click', this._onAppClick.bind(this));
			this.appList.on('filter:click', this._onAppFilterClick.bind(this));
			this.clearBtn = this.logCenterPage.querySelector('#btn-clear');
			this.clearBtn.style.display = 'none';
			this.clearBtn.addEventListener('click', this._onClearClick.bind(this));
		},
		run: function() {
			this.user = x.session.get('username');
			x.data.fetch('/log-center/users', {username: this.user})
				.then(this._onUserExist.bind(this));
		},

		connectStream: function(user, app) {
			if (!this._socket) {
				var socket = this._socket = io.connect(window.location.origin);
				socket.on('sentinel:new-log', function(data) {
					if (this.user === data.user) {
						if (this.app === data.app) {
							this.console.write(data);
						}
						this.appList.updateIndicators(data);
					}
				}.bind(this));
				socket.on('sentinel:new-app', function(data) {
					if (this.user === data.user) {
						this.appList.add(data.app);
					}
				}.bind(this));
				socket.on('sentinel:new-user', function(data) {
					this.userCarousel.add(data.user);
				}.bind(this));
			}
			this.console.clear();
			this._socket.emit('console:disconnection');
			this._socket.emit('console:connection', {
				user: user,
				app: app
			});
		},


		// Events handlers ---------------------------------------------------------

		_onUserExist: function(user) {
			if (!user.exists) {
				this.user = 'global';
				x.session.del('username');
			}
			this.userCarousel = new UserCarousel({
				currentUser: this.user === 'global' ? null : this.user,
				dataSource: 'log-center/users'
			});
			this.userCarousel.on('item:click', this._onUserClick.bind(this));
			this.nodes.one('.user-box').appendChild(this.userCarousel.root);

			this.appList.dataSource = '/log-center/'+ this.user + '/apps';
			this.connectStream(this.user, null);
		},
		_onAppClick: function(item) {
			this.app = item.id;
			this.connectStream(this.user, this.app);
		},
		_onAppFilterClick: function(data) {
			this.console.setFilters(data.filterStates);
		},
		_onClearClick: function() {
			this.console.clear();
		},
		_onUserClick: function(user) {
			if (this.user === user) {
				return;
			}
			this.user = user;
			x.session.set('username', user);
			this.appList.dataSource = '/log-center/'+ this.user + '/apps';
			this.connectStream(this.user, null);
		}
	});

	return LogCenter;
});
