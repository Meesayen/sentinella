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
	'lib/logger',
	'lib/dom-handler',

	'comp/app-list',
	'comp/console'
], function(
	x,
	Class,
	templates,
	Logger,
	DomHandler,

	AppList,
	Console
) {
	window.Logger = Logger;

	var LogCenter = Class({
		parent: DomHandler,
		constructor: function() {
			this._root = document.body;
			this._sourceUrl = '/log-center/stream';
			this.user = null;
			this.objectMaps = [];
			this.loginPage = this.nodes.one('#login');
			this.logCenterPage = this.nodes.one('#log-center');
			this.console = new Console({
				hook: '#console'
			});
			this.appList = new AppList({
				hook: '#apps'
			});
			this.appList.on('item:click', this.handleAppClick.bind(this));
			this.appList.on('filter:click', this.handleAppFilterClick.bind(this));
			this._initBtns();
			this.nodes.del(this.logCenterPage);
		},
		run: function() {
			this.user = x.session.get('username');
			if (!this.user) {
				var loginBtn = x.query(this.loginPage, '.btn');
				x.query(this.loginPage, 'input').focus();
				loginBtn.addEventListener('click', function() {
					var username = x.query(this.loginPage, 'input').value;
					if (!username) {
						return;
					}

					this.user = username;
					x.session.set('username', this.user);
					this.nodes.del(this.loginPage);
					this.nodes.add(this.logCenterPage);
					this.logoutBtn.innerHTML = 'Logout: ' + this.user;
					this.logoutBtn.style.display = '';

					this.appList.dataSource = '/log-center/'+ this.user + '/apps';
					this.connectStream(this.user, null);
				}.bind(this));
			} else {
					this.nodes.del(this.loginPage);
					this.nodes.add(this.logCenterPage);
					this.logoutBtn.innerHTML = 'Logout: ' + this.user;
					this.logoutBtn.style.display = '';

					this.appList.dataSource = '/log-center/'+ this.user + '/apps';
					this.connectStream(this.user, null);
			}
		},

		connectStream: function(user, app) {
			if (window.source) {
				source.close();
			}
			this.console.clear();
			if (!app) {
				window.source = this._getSource(user);
				source.addEventListener('addapp', function(e) {
					this.appList.add(JSON.parse(e.data).app);
				}.bind(this), false);
			} else {
				this.clearBtn.style.display = '';
				window.source = this._getSource(user, app);
				source.addEventListener('message', function(e) {
					this.console.write(JSON.parse(e.data));
				}.bind(this), false);
				source.addEventListener('addapp', function(e) {
					this.appList.add(JSON.parse(e.data).app);
				}.bind(this), false);
			}
		},


		// Events handlers ---------------------------------------------------------

		handleAppClick: function(item) {
			this.app = item.id;
			this.connectStream(this.user, this.app);
		},
		handleAppFilterClick: function(data) {
			this.console.setFilters(data.filterStates);
		},
		handleClearClick: function() {
			this.console.clear();
		},
		handleLogoutClick: function() {
			x.session.del('username');
			window.location = window.location;
		},


		// Private methods ---------------------------------------------------------
		_getSource: function(user, app) {
			app = app || 'dummy';
			return new EventSource([this._sourceUrl, user, app].join('/'));
		},

		_initBtns: function() {
			this.clearBtn = this.logCenterPage.querySelector('#btn-clear');
			this.logoutBtn = this.logCenterPage.querySelector('#btn-logout');
			this.clearBtn.style.display = 'none';
			this.logoutBtn.style.display = 'none';
			this.clearBtn.addEventListener('click', this.handleClearClick.bind(this));
			this.logoutBtn.addEventListener('click', this.handleLogoutClick.bind(this));
		}
	});

	return LogCenter;
});
