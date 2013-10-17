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
			this.__boundOfFilterClick = this._onFilterClick.bind(this);
			this.__boundOnInputClick = this._onInputClick.bind(this);
			for (var i = 0, f; f = this._filters[i]; i++) {
				f.addEventListener('click', this.__boundOfFilterClick);
			}
			var input = this.nodes.one('input');
			input.addEventListener('click', this.__boundOnInputClick);
		},
		deselect: function() {
			this._isSelected = false;
		},
		click: function() {
			this.nodes.one('input').click();
		},
		destroy: function() {
			for (var i = 0, f; f = this._filters[i]; i++) {
				f.removeEventListener('click', this.__boundOfFilterClick);
			}
			this.nodes.one('input').removeEventListener('click', this.__boundOnInputClick);
			this.removeEvent();
		},
		updateIndicators: function(type) {
			var filter = this.nodes.one('.filter[data-type="' + type + '"]');
			if (!this._isSelected || filter.dataset.state === 'off') {
				var news = parseInt(filter.dataset.news, 10) + 1;
				if (news > 99) {
					news = '99+';
				}
				filter.dataset.news = news;
				filter.classList.add('has-new');
			}
		},
		_onInputClick: function(e) {
			this._isSelected = true;
			this.emit('item:click', {
				id: e.target.value
			}, this);
			for (var i = 0, f; f = this._filters[i]; i++) {
				if (f.dataset.state === 'on') {
					f.dataset.news = 0;
					f.classList.remove('has-new');
				}
			}
			this._filterUpdated();
		},
		_onFilterClick: function(e) {
			if (!this._isSelected) {
				this.nodes.one('input').click();
			} else {
				var
					filter = e.target,
					filterData = filter.dataset;

				if (filterData.state === 'on') {
					filterData.state = 'off';
				} else {
					filterData.state = 'on';
					filter.classList.remove('has-new');
					filter.dataset.news = 0;
				}
				this._filterUpdated();
			}
		},
		_filterUpdated: function() {
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
