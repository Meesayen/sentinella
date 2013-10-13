define([
	'lib/common',
	'lib/class',
	'lib/dom-handler'
], function(
	x,
	Class,
	DomHandler
) {

	var AppItem = Class({
		parent: DomHandler,
		constructor: function(o) {
			this._root = x.render('app.item', o);
			this._isSelected = false;
			this._filters = this.nodes.every('.filter');
			for (var i = 0, f; f = this._filters[i]; i++) {
				f.addEventListener('click', this._onFilterClick.bind(this));
			}
			var input = this.nodes.one('input');
			input.addEventListener('click', this._onInputClick.bind(this));
		},
		deselect: function() {
			this._isSelected = false;
		},
		_onInputClick: function(e) {
			this._isSelected = true;
			this.emit('item:click', {
				id: e.target.value
			}, this);
			this._onFilterClick(e);
		},
		_onFilterClick: function(e) {
			var
				filter = e.target,
				filterData = filter.dataset;

			if (filterData.state === 'on') {
				filterData.state = 'off';
			} else {
				filterData.state = 'on';
			}

			var filterStates = this._filters.map(function(filter) {
				var
					o = {},
					filterData = filter.dataset;

				o[filterData.type] = filterData.state === 'on' ? true : false;
				return o;
			}).reduce(function(cur, next) {
				for (var k in next) {
					cur[k] = next[k]
				}
				return cur;
			});
			if (this._isSelected) {
				this.emit('filter:click', {
					filterStates: filterStates
				});
			}
		}
	});

	return AppItem;
});
