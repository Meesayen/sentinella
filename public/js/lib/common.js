define([
	'require',
	'lib/templates'
], function(
	require,
	templates
) {

	var
		ss = window.sessionStorage,
		ls = window.localStorage,
		_slice = Array.prototype.slice;

	var Promise = function() {
		this._data = null;
		this._status = null;
		this._callbacks = [];
	};
	Promise.prototype = {
		then: function(onComplete, onReject, onProgress) {
			var
				p = new Promise(),
				callback = null;
			if (this._data) {
				if (this._status === 'completed') {
					callback = onComplete;
				} else if (this._status === 'rejected') {
					callback = onReject;
				} else {
					callback = onProgress;
				}
				var f = callback(this._data);
				if (f) {
					f.then(
						p.complete,
						p.reject,
						p.progress
					);
				}
			} else {
				this._callbacks.push({
					'complete': onComplete,
					'reject': onReject,
					'progress': onProgress,
					'promise': p
				});
			}
			return p;
		},
		complete: function(data) {
			this._data = data;
			this._status = 'completed';
			this._trigger('complete');
		},
		reject: function(data) {
			this._data = data;
			this._status = 'rejected';
			this._trigger('reject');
		},
		progress: function(data) {
			this._data = data;
			this._status = 'progressing';
			this._trigger('progress');
		},
		_trigger: function(status) {
			for (var i = 0, cb; cb = this._callbacks[i]; i++) {
				if (cb[status]) {
					var
						f = cb[status](this._data),
						p = cb['promise'];
					if (f) {
						f.then(
							function() {p.complete.apply(p, _slice.call(arguments, 0))},
							function() {p.reject.apply(p, _slice.call(arguments, 0))},
							function() {p.progress.apply(p, _slice.call(arguments, 0))}
						);
					}
				}
			}
		}
	};

	var _req = function(method, url, params) {
		var p = new Promise();
		var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.onload = function() {
			if (this.status === 200) {
				p.complete(JSON.parse(this.response));
			} else {
				p.reject();
			}
		};
		xhr.onerror = function() {
			p.reject();
		};
		if (method === 'GET') {
			xhr.send();
		} else {
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.send(JSON.stringify(params));
		}
		return p;
	};

	return {
		render: (function() {
			var
				domPot = document.createElement('div'),
				firstChild = null,
				render = ECT({ root: templates }).render;
			return function(template, data, forceString) {
				if (forceString) {
					return render(template, data);
				}
				domPot.innerHTML = render(template, data);
				firstChild = domPot.firstChild;
				while(firstChild != null && firstChild.nodeType == 3){
					firstChild = firstChild.nextSibling;
				}
				return firstChild;
			}
		})(),
		forceRepaint: function(element) {
			element.style.display = 'none';
			element.offsetHeight;
			element.style.display = '';
		},
		extend: function(obj, other) {
			for (var k in other) {
				obj[k] = other[k];
			}
		},
		cache: {
			set: function(key, value) {
				ls.setItem(key, value);
			},
			get: function(key) {
				return ls.getItem(key);
			},
			del: function(key) {
				ls.removeItem(key);
			}
		},
		session: {
			set: function(key, value) {
				ss.setItem(key, value);
			},
			get: function(key) {
				return ss.getItem(key);
			},
			del: function(key) {
				ss.removeItem(key);
			}
		},
		data: {
			fetch: function(url, params) {
				if (params) {
					var queryChunks = [];
					for (var k in params) {
						queryChunks.push(k + '=' + params[k]);
					}
					url += '?';
					url += queryChunks.join('&');
				}
				return _req('GET', url, null);
			},
			push: function(url, params) {
				return _req('POST', url, params);
			}
		},
		query: function(node, selector) {
			if (typeof node === 'string') {
				selector = node;
				node = document;
			}
			return node.querySelector(selector);
		},
		queryAll: function(node, selector) {
			if (typeof node === 'string') {
				selector = node;
				node = document;
			}
			return node.querySelectorAll(selector);
		},
		require: require,
		Promise: Promise
	}
});

