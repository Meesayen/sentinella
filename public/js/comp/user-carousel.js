define([
	'lib/common',
	'lib/class',
	'lib/dom-handler'
], function(
	x,
	Class,
	DomHandler
) {

	var WHEEL_EVT = 'onwheel' in window ? 'wheel' : 'mousewheel';

	var UserCarousel = Class({
		parent: DomHandler,
		constructor: function(o) {
			this._root = x.render('comp.user-carousel', {
				currentUser: o.currentUser || 'no user'
			});
			this._currentUser = o.currentUser;
			this._head = 0;
			this._tail = 0;
			this._userItems = this.nodes.every('.users .user');
			this._userList = this.nodes.one('.users');
			this._userListInitialized = false;
			if (o.dataSource) {
				x.data.fetch(o.dataSource)
					.then(this._onUserFetched.bind(this));
			} else {
				this._users = o.users || [];
				if (this._users.length) {
					this._fillUserList();
				}
			}
		},
		add: function(user) {
			this._users.push({
				name: user,
				selected: user === this._currentUser
			});
			if (this._users.length < 5) {
				this._fillUserList();
			}
		},
		_fillUserList: function() {
			var len = this._users.length;
			if (len === 1) {
				this._triggerUserClick(this._users[0]);
				return;
			}
			if (len > 1) {
				this._initUserList();
			}
			for (var i = 0; i < len; i++) {
				if (this._users[i].name === this._currentUser) {
					this._head = this._decreaseIndex(i);
					this._tail = this._increaseIndex(i);
					break;
				}
			}
			var users = this._userItems;
			users[2].innerText = this._users[this._increaseIndex(this._head)].name;
			users[2].dataset.id = this._increaseIndex(this._head);
			users[1].innerText = this._users[this._head].name;
			users[1].dataset.id = this._head;
			this._head = this._decreaseIndex(this._head);
			users[0].innerText = this._users[this._head].name;
			users[0].dataset.id = this._head;
			users[3].innerText = this._users[this._tail].name;
			users[3].dataset.id = this._tail;
			this._tail = this._increaseIndex(this._tail);
			users[4].innerText = this._users[this._tail].name;
				users[4].dataset.id = this._tail;
		},
		_onUserFetched: function(data) {
			var currentUser = this._currentUser;
			this._users = data.map(function(user) {
				return {
					name: user,
					selected: user === currentUser
				}
			});
			if (this._users.length) {
				this._fillUserList();
			}
		},
		_initUserList: function() {
			if (this._userListInitialized) {
				return;
			}
			this._userListInitialized = true;
			this._root.classList.add('filled');
			this.nodes.one('.hint').addEventListener('click', this._openCarousel.bind(this));
			this._userList.addEventListener(WHEEL_EVT, this._onWheel.bind(this));
			this._userList.addEventListener('mouseleave', this._triggerCloseCarousel.bind(this));
			this._userList.addEventListener('mouseenter', this._cancelCloseCarousel.bind(this));
			var users = this._userItems;
			for (var i = 0, u; u = users[i]; i++) {
				u.addEventListener('click', this._onUserClick.bind(this));
			}
		},
		next: function() {
			this._head = this._increaseIndex(this._head);
			this._tail = this._increaseIndex(this._tail);
			var item = this._userItems.shift();
			this._userItems.push(item);
			this._userList.classList.remove('previous');
			this._userList.classList.add('next');
			this._userList.appendChild(item)
			item.innerText = this._users[this._tail].name;
			item.dataset.id = this._tail;
		},
		previous: function() {
			this._head = this._decreaseIndex(this._head);
			this._tail = this._decreaseIndex(this._tail);
			var item = this._userItems.pop();
			this._userItems.unshift(item);
			this._userList.classList.remove('next');
			this._userList.classList.add('previous');
			this._userList.insertBefore(item, this._userList.firstChild)
			item.innerText = this._users[this._head].name;
			item.dataset.id = this._head;
		},
		_increaseIndex: function(index) {
			index++;
			if (index === this._users.length) {
				index = 0;
			}
			return index;
		},
		_decreaseIndex: function(index) {
			index--;
			if (index === -1) {
				index += this._users.length;
			}
			return index;
		},
		_onUserClick: function(e) {
			var item = this._users[e.target.dataset.id];
			this._triggerUserClick(item);
		},
		_triggerUserClick: function(item) {
			this.nodes.one('.user .name').innerText = item.name;
			this._closeCarousel();
			this.emit('item:click', item.name);
		},
		_triggerCloseCarousel: function() {
			this._delayedClosing = setTimeout(this._closeCarousel.bind(this), 900);
		},
		_cancelCloseCarousel: function() {
			this._delayedClosing && clearTimeout(this._delayedClosing);
		},
		_closeCarousel: function(e) {
			this._root.classList.add('activated');
			this._closingTimeout = setTimeout(function() {
				this._root.classList.add('closed');
				this._root.classList.remove('activated');
			}.bind(this), 500);
		},
		_openCarousel: function(e) {
			this._closingTimeout && clearTimeout(this._closingTimeout);
			this._root.classList.remove('activated');
			this._root.classList.remove('closed');
		},
		_onWheel: function(e) {
			if (!this._delayingWheel) {
				this._delayingWheel = setTimeout(this._stopDelayingWheel.bind(this), 200);
				if (e.wheelDelta < 0) {
					this.next();
				} else {
					this.previous();
				}
			}
		},
		_stopDelayingWheel: function() {
			this._delayingWheel = null;
		}
	});

	return UserCarousel;
});
