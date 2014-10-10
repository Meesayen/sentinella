import DomHandler from '../core/dom-handler.es6';
import { renderSync } from '../core/tpl.es6';

export default class AppItem extends DomHandler {
	constructor(o) {
		this.root = renderSync('app-item', o);
		this._DomHandler_bindingsCache = {};
		this._isSelected = false;
		this._filters = this.nodes.every('.filter');
		this.__boundOfFilterClick = this._onFilterClick.bind(this);
		this.__boundOnInputClick = this._onInputClick.bind(this);
		for (var f of this._filters) {
			f.addEventListener('click', this.__boundOfFilterClick);
		}
		var input = this.nodes.one('input');
		input.addEventListener('click', this.__boundOnInputClick);
	}
	deselect() {
		this._isSelected = false;
	}
	click() {
		this.nodes.one('input').click();
	}
	destroy() {
		for (var f of this._filters) {
			f.removeEventListener('click', this.__boundOfFilterClick);
		}
		this.nodes.one('input').removeEventListener('click',
				this.__boundOnInputClick);
		this.removeEvent();
	}
	updateIndicators(type) {
		var filter = this.nodes.one(`.filter[data-type="${type}"]`);
		if (!this._isSelected || filter.dataset.state === 'off') {
			var news = parseInt(filter.dataset.news, 10) + 1;
			if (news > 99) {
				news = '99+';
			}
			filter.dataset.news = news;
			filter.classList.add('has-new');
		}
	}
	_onInputClick(e) {
		this._isSelected = true;
		this.emit('item:click', {
			id: e.target.value
		}, this);
		for (var f of this._filters) {
			if (f.dataset.state === 'on') {
				f.dataset.news = 0;
				f.classList.remove('has-new');
			}
		}
		this._filterUpdated();
	}
	_onFilterClick(e) {
		var
			filter = e.target,
			filterData = filter.dataset;
		if (!this._isSelected) {
			this.nodes.one('input').click();
		} else {
			if (filterData.state === 'on') {
				filterData.state = 'off';
			} else {
				filterData.state = 'on';
				filter.classList.remove('has-new');
				filter.dataset.news = 0;
			}
			this._filterUpdated();
		}
	}
	_filterUpdated() {
		var filterStates = this._filters.map(filter => {
			var
				o = {},
				filterData = filter.dataset;

			o[filterData.type] = filterData.state === 'on' ? true : false;
			return o;
		}).reduce((cur, next) => {
			Object.keys(next).forEach(k => {
				cur[k] = next[k];
			});
			return cur;
		});
		if (this._isSelected) {
			this.emit('filter:click', {
				filterStates: filterStates
			});
		}
	}
}
