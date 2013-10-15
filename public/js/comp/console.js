define([
	'lib/common',
	'lib/class',
	'lib/dom-handler'
], function(
	x,
	Class,
	DomHandler
) {

	var Console = Class({
		parent: DomHandler,
		constructor: function(o) {
			o = o || {};
			if (o.hook) {
				this._root = x.query(o.hook);
			}
			if (!this._root) {
				this._root = document.createElement('div');
				this._root.id = 'console';
			}
			this.clear();
			this.objectMaps = [];
			this._reference = x.query('.reference-popover');
			this._root.addEventListener('click', this._expandReference.bind(this));

		},
		write: function(data) {
			var
				toScroll = false,
				root = this._root;

			data.msg = this._parseMessageChunks(data.chunks);
			data.formatDate = this._formatDate;
			var log = x.render('log.message', data)
			if ((root.scrollHeight - root.offsetHeight) < (root.scrollTop)) {
				toScroll = true;
			}
			root.insertBefore(log, root.lastChild);
			if (toScroll) {
				root.scrollTop = root.scrollHeight;
			}
		},
		clear: function() {
			this._root.innerHTML = '<div class="padding-top"></div><div class="void"></div>';
		},
		setFilters: function(filterStates) {
			this._setFilters(filterStates)
		},
		_formatDate: (function() {
			var padNumber = function(num) {
				if (num < 10) return '0' + num;
				else return num;
			};
			return function(timestamp) {
				var
					date = new Date(timestamp),
					d = padNumber(date.getDate()),
					m = padNumber(date.getMonth() + 1),
					y = date.getFullYear(),
					hh = padNumber(date.getHours()),
					mm = padNumber(date.getMinutes()),
					ss = padNumber(date.getSeconds());
				return '[' + [d, m, y].join('-') + ' ' + [hh, mm, ss].join(':') + ']';
			}
		})(),
		_parseMessageChunks: function(data) {
			var item;
			var messageChunks = [];
			var objectMap = [];
			var logId = this.objectMaps.length;
			for (var i = 0, l = data.length; i < l; i++) {
				item = data[i];
				if (typeof item === 'number' || typeof item === 'string') {
					messageChunks.push(item);
				} else {
					var id = objectMap.length;
					objectMap.push(item);
					messageChunks.push(x.render('log.reference', {
						logId: logId,
						id: id,
						label: item instanceof Array ? '[array]' : '[object]'
					}, true));
				}
			}
			this.objectMaps.push(objectMap);
			return messageChunks.join(' ');
		},
		_expandReference: function(e) {
			var refEl = document.elementFromPoint(e.pageX, e.pageY);
			if (refEl.classList.contains('reference')) {
				var refData = refEl.dataset;
				this._reference.style.left = (refEl.offsetLeft + (refEl.clientWidth / 2)) + 'px';
				this._reference.style.top = (refEl.offsetTop + (refEl.clientHeight * 2)) + 'px';
				this._reference.classList.remove('hidden');
				this._reference.innerHTML = x.render('log.object', {
					map: this.objectMaps[refData.logId][refData.id]
				}, true);
			} else {
				this._reference.classList.add('hidden');
			}
		},
		_setFilters: function(filterStates) {
			var
				toScroll = false,
				root = this._root;

			if ((root.scrollHeight - root.offsetHeight) < (root.scrollTop)) {
				toScroll = true;
			}
			for (var type in filterStates) {
				if (filterStates[type]) {
					root.classList.add(type);
				} else {
					root.classList.remove(type);
				}
			}
			if (toScroll) {
				root.scrollTop = root.scrollHeight;
			}
		}
	});

	return Console;
});
