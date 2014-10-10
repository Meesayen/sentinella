/*!
 * logger.js 1.1.0
 * Polyfunctional logger class. Its main purpose is to push logs to its
 * companion, Sentinel, a web console written on top of node.js,
 * distributed under the MIT license.
 *
 * Copyright 2013, Federico Giovagnoli <mailto:gvg.fede@gmail.com>
 * Released under the MIT license
 */

import { device } from './utils.es6';

var
  __LoggerStaticFinalInstances__ = {},
  UA = device.userAgent,
  slice = Array.prototype.slice,
  toCamelCase = (string) => {
    return string
      .split('-')
      .reduce((curr, next) => curr + String.fromCharCode(
          next.charCodeAt(0) - 32) + next.slice(1));
  };

class Logger {
  constructor(name, opts) {
    if (name && typeof name !== 'string') {
      opts = name;
      name = 'global';
    }
    if (__LoggerStaticFinalInstances__[name] === undefined) {
      __LoggerStaticFinalInstances__[name] = this._createInstance(name, opts);
    }
    return __LoggerStaticFinalInstances__[name];
  }

  log() {
    this._write('[INFO]', 'info', slice.call(arguments, 0));
  }

  info() {
    this._write('[INFO]', 'info', slice.call(arguments, 0));
  }

  warn() {
    this._write('[WARNING]', 'warning', slice.call(arguments, 0));
  }

  err() {
    this._write('[ERROR]', 'error', slice.call(arguments, 0));
  }

  addUser(user) {
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
  }


  /* Privates  ----------------------------------------------------------  */

  _createInstance(name='global', opts={}) {
    this._channel = name;
    this._user = opts.user || 'global';
    this._tmpUser = null;
    this._url = (opts.url || 'http://localhost:1337') + '/log';

    this._write = this._xhrWrite;
    if (opts && opts.forceXhr !== true) {
      if (UA.indexOf('Chrome') > -1) {
        this._write = this._consoleWrite;
      }
    }
    return this;
  }

  _xhrWrite(label, type, chunks) {
    var user = this._user;
    if (this._tmpUser) {
      user = this._tmpUser;
      this._tmpUser = null;
    }
    var
      xhr = new XMLHttpRequest(),
      params = this._serialize({
        'app': this._channel,
        'time': new Date().getTime(),
        'label': label,
        'chunks': chunks,
        'type': type,
        'user': user
      });

    xhr.open('POST', this._url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(params);
  }

  _consoleWrite(label, type, chunks) {
    var user = this._user;
    if (this._tmpUser) {
      user = this._tmpUser;
      this._tmpUser = null;
    }
    chunks.unshift(label.slice(0, label.length - 1) + ':' + user + ']');
    console.log.apply(console, chunks);
  }

  _serialize(object) {
    return JSON.stringify(object, (k, v) => {
      if (v instanceof HTMLElement) {
        return '[HTMLElement]';
      } else {
        return v;
      }
    });
  }
}

export default Logger;

var _log = (function() {
  var
    forceXhr = true,
    name = 'global',
    eTitle = document.querySelector('head title');
  if (device.isMobile) {
    forceXhr = true;
  }
  if (eTitle && eTitle.innerHTML) {
    name = eTitle.innerHTML.replace(/\W*/g, '');
  }
  return new Logger(name, {
    forceXhr: forceXhr
  });
})();

export var getLogger = function() {
  return _log;
};

export var setLogger = (name, o) => {
  return (_log = new Logger(name, o));
};
