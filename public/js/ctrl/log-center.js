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
	'comp/user-carousel',
	'comp/console'
], function(
	x,
	Class,
	templates,
	Logger,
	DomHandler,

	AppList,
	UserCarousel,
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
			this.logCenterPage = this.nodes.one('#log-center');
			this.console = new Console({
				hook: '#console'
			});
			this.user = x.session.get('username');
			this.userCarousel = new UserCarousel({
				currentUser: this.user,
				dataSource: 'log-center/users'
			});
			this.userCarousel.on('item:click', this.handleUserClick.bind(this));
			this.nodes.one('.user-box').appendChild(this.userCarousel.root);
			this.appList = new AppList({
				hook: '#apps'
			});
			this.appList.on('item:click', this.handleAppClick.bind(this));
			this.appList.on('filter:click', this.handleAppFilterClick.bind(this));
			this._initBtns();
		},
		run: function() {
			if (this.user) {
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
				source.addEventListener('adduser', function(e) {
					this.userCarousel.add(JSON.parse(e.data).user);
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
		handleUserClick: function(user) {
			this.user = user;
			x.session.set('username', user);
			this.appList.dataSource = '/log-center/'+ this.user + '/apps';
			this.connectStream(this.user, null);
		},


		// Private methods ---------------------------------------------------------
		_getSource: function(user, app) {
			app = app || 'dummy';
			return new EventSource([this._sourceUrl, user, app].join('/'));
		},

		_initBtns: function() {
			this.clearBtn = this.logCenterPage.querySelector('#btn-clear');
			this.clearBtn.style.display = 'none';
			this.clearBtn.addEventListener('click', this.handleClearClick.bind(this));
		}
	});

	return LogCenter;
});
