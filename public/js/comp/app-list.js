define([
	'lib/common',
	'lib/class',
	'lib/dom-handler',

	'comp/app-item'
], function(
	x,
	Class,
	DomHandler,

	AppItem
) {

	var AppList = Class({
		parent: DomHandler,
		constructor: function(o) {
			o = o || {};
			if (o.hook) {
				this._root = x.query(o.hook);
			}
			if (!this._root) {
				this._root = document.createElement('ul');
				this._root.id = 'apps';
			}
			this._selectedApp = null;
			this._dataSource = o.dataSource || null;
			this.refresh();
		},
		accessors: {
			dataSource: {
				get: function() {
					return this._dataSource;
				},
				set: function(newValue) {
					this._dataSource = newValue;
					this.refresh();
				}
			}
		},
		refresh: function() {
			if (this._dataSource === null) {
				this._fillAppsList([]);
			} else {
				x.data.fetch(this._dataSource, null)
					.then(this._fillAppsList.bind(this));
			}
		},
		add: function(appId) {
			var appItem = new AppItem({ id: appId });
			appItem.on('item:click', this._onItemClick.bind(this));
			appItem.on('filter:click', this._onFilterClick.bind(this));
			this.nodes.add(appItem.root);
		},
		_fillAppsList: function(apps) {
			for (var i = 0, a; a = apps[i]; i++) {
				this.add(a);
			}
		},
		_onItemClick: function(data, item) {
			if (this._selectedApp) {
				this._selectedApp.deselect();
			}
			this._selectedApp = item;
			this.emit('item:click', data);
		},
		_onFilterClick: function(data) {
			this.emit('filter:click', {
				filterStates: data.filterStates
			});
		}
	});

	return AppList;
});
