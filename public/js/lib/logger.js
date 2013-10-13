// <pre>
//	logger.js  1.0.0
//
//
//    _/_/_/  _/_/      _/_/      _/_/      _/_/_/    _/_/_/  _/    _/    _/_/    _/_/_/
//   _/    _/    _/  _/_/_/_/  _/_/_/_/  _/_/      _/    _/  _/    _/  _/_/_/_/  _/    _/
//  _/    _/    _/  _/        _/            _/_/  _/    _/  _/    _/  _/        _/    _/
// _/    _/    _/    _/_/_/    _/_/_/  _/_/_/      _/_/_/    _/_/_/    _/_/_/  _/    _/
//                                                              _/
//                                                         _/_/
//
//	(c) 2012 Federico Giovagnoli (meesayen)
//	Logger may be freely distributed under the MIT license.
// </pre>

(function() {

if ('function' !== typeof Array.prototype.reduce) {
	Array.prototype.reduce = function(callback, opt_initialValue){
		'use strict';
		if (null === this || 'undefined' === typeof this) {
			// At the moment all modern browsers, that support strict mode, have
			// native implementation of Array.prototype.reduce. For instance, IE8
			// does not support strict mode, so this check is actually useless.
			throw new TypeError(
					'Array.prototype.reduce called on null or undefined');
		}
		if ('function' !== typeof callback) {
			throw new TypeError(callback + ' is not a function');
		}
		var index, value,
				length = this.length >>> 0,
				isValueSet = false;
		if (1 < arguments.length) {
			value = opt_initialValue;
			isValueSet = true;
		}
		for (index = 0; length > index; ++index) {
			if (this.hasOwnProperty(index)) {
				if (isValueSet) {
					value = callback(value, this[index], index, this);
				}
				else {
					value = this[index];
					isValueSet = true;
				}
			}
		}
		if (!isValueSet) {
			throw new TypeError('Reduce of empty array with no initial value');
		}
		return value;
	};
}

var
	__LoggerStaticFinalInstances__ = {},
	UA = window.navigator.userAgent,
	slice = Array.prototype.slice;

var toCamelCase = function(string) {
	return string
		.split('-')
		.reduce(function(curr, next, idx, arr) {
			return curr+String.fromCharCode(next.charCodeAt(0)-32)+next.slice(1);
		});
};

var Logger = function(name, opts) {
	if (name && typeof name !== 'string') {
		opts = name;
		name = 'global';
	}
	if (__LoggerStaticFinalInstances__[name] === undefined) {
		__LoggerStaticFinalInstances__[name] = this._createInstance(name, opts || {});
	}
	return __LoggerStaticFinalInstances__[name];
};

Logger.prototype = {

	log: function() {
		this._write('[INFO]', 'info', slice.call(arguments, 0));
	},

	info: function() {
		this._write('[INFO]', 'info', slice.call(arguments, 0));
	},

	warn: function() {
		this._write('[WARNING]', 'warning', slice.call(arguments, 0));
	},

	err: function() {
		this._write('[ERROR]', 'error', slice.call(arguments, 0));
	},

	addUser: function(user) {
		if (user.indexOf('-') > -1) {
			try {
				user = toCamelCase(user);
			} catch(e) {}
		}
		Object.defineProperty(this, user, {
			get: function() {
				this._tmpUser = user;
				return this;
			},
			set: function() {},
			enumerable: true,
			configurable: true
		});
	},


	/* Privates  ----------------------------------------------------------  */

	_createInstance: function(name, opts) {
		this._channel = name;
		this._user = opts.user || 'meesayen';
		this._tmpUser = null;
		this._url = (opts.url || 'http://localhost:1337') + '/log';

		this._write = this._xhrWrite;
		if (opts && opts.forceXhr !== true) {
			if (UA.indexOf('Chrome') > -1) {
				this._write = this._consoleWrite;
			}
		}
		return this;
	},

	_xhrWrite: function(label, type, chunks) {
		var user = this._user;
		if (this._tmpUser) {
			user = this._tmpUser;
			this._tmpUser = null;
		}
		var xhr = new XMLHttpRequest(),
				params = this._serialize({
					'app': this._channel,
					'time': new Date().getTime(),
					'label': label,
					'chunks': chunks,
					'type': type,
					'user': user
				});
		xhr.open('POST', this._url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(params);
	},

	_consoleWrite: function(label, type, chunks) {
		chunks.unshift(label);
		console.log.apply(console, chunks);
	},

	_serialize: function(object) {
		return JSON.stringify(object, function(k, v) {
			if (v instanceof HTMLElement) {
				return '[HTMLElement]';
			} else {
				return v;
			}
		});
	}
};

if (typeof define === 'function' && define.amd) {
	define(function() {
		return Logger;
	});
} else {
	window.Logger = Logger;
}


})();
