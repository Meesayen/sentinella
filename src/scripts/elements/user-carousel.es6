import DomHandler from '../core/dom-handler.es6';
import { renderSync } from '../core/tpl.es6';
import Store from '../core/store.es6';
import storeRegistry from '../config/storeRegistry.es6';

var store = new Store(storeRegistry);

var WHEEL_EVT = 'onwheel' in window ? 'wheel' : 'mousewheel';

export default class UserCarousel extends DomHandler {
	constructor(o) {
		this.root = renderSync('user-carousel', {
			currentUser: o.currentUser || 'no user'
		});
		this._currentUser = o.currentUser;
		this._head = 0;
		this._tail = 0;
		this._userItems = this.nodes.every('.users .user');
		this._userList = this.nodes.one('.users');
		this._userListInitialized = false;
		if (o.dataSource) {
			// FIXME
			store.get(o.dataSource)
				.then(this._onUserFetched.bind(this));
		} else {
			this._users = o.users || [];
			if (this._users.length) {
				this._fillUserList();
			}
		}
	}
	add(user) {
		this._users.push({
			name: user,
			selected: user === this._currentUser
		});
		if (this._users.length < 5) {
			this._fillUserList();
		}
	}
	_fillUserList() {
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
	}
	_onUserFetched(data) {
		var currentUser = this._currentUser;
		this._users = data.map(user => ({
			name: user,
			selected: user === currentUser
		}));
		if (this._users.length) {
			this._fillUserList();
		}
	}
	_initUserList() {
		var
			users = this._userItems,
			userList = this._userList;
		if (this._userListInitialized) {
			return;
		}
		this._userListInitialized = true;
		this.root.classList.add('filled');
		this.nodes.one('.hint').addEventListener('click', this._openCarousel.bind(this));
		userList.addEventListener(WHEEL_EVT, this._onWheel.bind(this));
		userList.addEventListener('mouseleave', this._triggerCloseCarousel.bind(this));
		userList.addEventListener('mouseenter', this._cancelCloseCarousel.bind(this));
		users.forEach(u => {
			u.addEventListener('click', this._onUserClick.bind(this));
		});
	}
	next() {
		var
			userList = this._userList,
			item = this._userItems.shift();
		this._head = this._increaseIndex(this._head);
		this._tail = this._increaseIndex(this._tail);
		this._userItems.push(item);
		userList.classList.remove('previous');
		userList.classList.add('next');
		userList.appendChild(item);
		item.innerText = this._users[this._tail].name;
		item.dataset.id = this._tail;
	}
	previous() {
		var
			userList = this._userList,
			item = this._userItems.pop();
		this._head = this._decreaseIndex(this._head);
		this._tail = this._decreaseIndex(this._tail);
		this._userItems.unshift(item);
		userList.classList.remove('next');
		userList.classList.add('previous');
		userList.insertBefore(item, userList.firstChild);
		item.innerText = this._users[this._head].name;
		item.dataset.id = this._head;
	}
	_increaseIndex(index) {
		index++;
		if (index === this._users.length) {
			index = 0;
		}
		return index;
	}
	_decreaseIndex(index) {
		index--;
		if (index === -1) {
			index += this._users.length;
		}
		return index;
	}
	_onUserClick(e) {
		var item = this._users[e.target.dataset.id];
		this._triggerUserClick(item);
	}
	_triggerUserClick(item) {
		this.nodes.one('.user .name').innerText = item.name;
		this._closeCarousel();
		this.emit('item:click', item.name);
	}
	_triggerCloseCarousel() {
		this._delayedClosing = setTimeout(this._closeCarousel.bind(this), 900);
	}
	_cancelCloseCarousel() {
		this._delayedClosing && clearTimeout(this._delayedClosing);
	}
	_closeCarousel() {
		this.root.classList.add('activated');
		this._closingTimeout = setTimeout(() => {
			this.root.classList.add('closed');
			this.root.classList.remove('activated');
		}, 500);
	}
	_openCarousel() {
		this._closingTimeout && clearTimeout(this._closingTimeout);
		this.root.classList.remove('activated');
		this.root.classList.remove('closed');
	}
	_onWheel(e) {
		if (!this._delayingWheel) {
			this._delayingWheel = setTimeout(this._stopDelayingWheel.bind(this), 400);
			if (e.wheelDelta < 0) {
				this.next();
			} else {
				this.previous();
			}
		}
	}
	_stopDelayingWheel() {
		this._delayingWheel = null;
	}
}
