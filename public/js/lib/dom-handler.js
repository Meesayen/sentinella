define([
	'lib/class',
	'lib/eventemitter'
], function(
	Class,
	EventEmitter
) {

	var _slice = Array.prototype.slice;

	var DomHandler = Class({
		parent: EventEmitter,
		constructor: function(o) {

		},
		accessors: {
			root: {
				get: function() {
					return this._root;
				}
			},
			nodes: {
				get: function() {
					var self = this;
					return {
						one: function(selector) {
							return self._root.querySelector(selector);
						},
						every: function(selector, pureNodeList) {
							if (pureNodeList) {
								return self._root.querySelectorAll(selector);
							} else {
								return _slice.call(self._root.querySelectorAll(selector), 0);
							}
						},
						add: function(element) {
							self._root.appendChild(element);
						},
						del: function(element) {
							self._root.removeChild(element);
						},
						clear: function() {
							self._root.innerHTML = '';
						}
					}
				}
			}
		}
	});

	return DomHandler;
});
