import DomHandler from '../core/dom-handler.es6';
import Store from '../core/store.es6';
import storeRegistry from '../config/storeRegistry.es6';
import AppItem from './app-item.es6';

var store = new Store(storeRegistry);

export default class AppList extends DomHandler {
	constructor(o={}) {
		if (o.hook) {
			this._root = document.querySelector(o.hook);
		}
		if (!this._root) {
			this._root = document.createElement('ul');
			this._root.id = 'apps';
		}
		this._apps = {};
		this._selectedApp = null;
		this._user = o.user || null;
		this.refresh();
	}
	get user() {
		return this._user;
	}
	set user(newVal) {
		this._user = newVal;
		this.refresh();
	}
	refresh() {
		if (this._user === null) {
			this._fillAppsList([]);
		} else {
			// FIXME
			store.get('user-apps', {
				':user': this._user
			}).then(this._fillAppsList.bind(this));
		}
	}
	add(appId) {
		var appItem = new AppItem({ id: appId });
		appItem.on('item:click', this._onItemClick.bind(this));
		appItem.on('filter:click', this._onFilterClick.bind(this));
		this.nodes.add(appItem.root);
		this._apps[appId] = appItem;
	}
	updateIndicators(message) {
		this._apps[message.app].updateIndicators(message.type);
	}
	_fillAppsList(apps) {
		Object.keys(this._apps).forEach(id => {
			this._apps[id].destroy();
		});
		this.nodes.clear();
		this._apps = {};
		apps.forEach(a => {
			this.add(a);
		});
		if (Object.keys(this._apps).length) {
			this._apps[apps[0]].click();
		}
	}
	_onItemClick(data, item) {
		if (this._selectedApp && this._selectedApp !== item) {
			this._selectedApp.deselect();
		}
		this._selectedApp = item;
		this.emit('item:click', data);
	}
	_onFilterClick(data) {
		this.emit('filter:click', {
			filterStates: data.filterStates
		});
	}
}
