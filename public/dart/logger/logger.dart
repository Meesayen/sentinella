// <pre>
//	logger.dart  1.0.0
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

#import('dart:html');
#import('dart:json');

#source('loggerConfig.dart');

typedef void Writer(String msg, [String type]);

class Logger {
  final name;
  static var _instances;
  Writer _write;

  // For screen writer only.
  Element _node;
  var _visible;
  var _timer;
  Function clear;
  Function show;
  Function hide;
  Function toggle;

  factory Logger(String name) {
    if (_instances == null) {
      _instances = {};
    }

    if (_instances.containsKey(name)) {
      return _instances[name];
    } else {
      final logger = new Logger._internal(name);
      _instances[name] = logger;
      return logger;
    }
  }

  Logger._internal(name) : this.name = name {
    // Disable such methods unless screen writing is enabled.
    this.clear = () {};
    this.show = () {};
    this.hide = () {};
    this.toggle = () {};

    if (loggerConfig['xhr'] == true) {
      this._write = _xhrWrite;
    } else if (window.console != null) {
      this._write = _consoleWrite;
    } else if (window.alert != null) {
      this._write = _alertWrite;
    } else {
      this._node = query('#logger');
      if (this._node == null) {
        this._write = (String msg) {return;};
      } else {
        this._visible = false;
        this._timer = null;
        this._write = this._screenWrite;

        this.clear = () {
          _node.innerHTML = '';
        };

        this.show = () {
          _visible = true;
          _node.classes.add('visible');
          if (_timer) {
            window.clearTimeout(_timer);
          }
          _timer = window.setTimeout(hide, 15000);
        };

        this.hide = function() {
          _visible = false;
          _node.classes.remove('visible');
        };

        this.toggle = function() {
          if (_visible) {
            if (_timer) {
              window.clearTimeout(this._timer);
            }
            hide();
          } else {
            show();
          }
        };
      }
    }
  }


  log(msg) {
    info(msg);
  }

  info(msg) {
    _write('[INFO] ${msg}', 'info');
  }

  warn(msg) {
    _write('[WARNING] ${msg}', 'warning');
  }

  err(msg) {
    _write('[ERROR] ${msg}', 'error');
  }

  void _xhrWrite(String msg, [String type='info']) {
    var time = new Date.now();
    var xhr = new XMLHttpRequest(),
        params = JSON.stringify({
          'app': name,
          'msg': '[$time] $msg',
          'type': type,
          'user': loggerConfig['user']
        });
    xhr.open('POST', loggerConfig['url'], true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(params);
  }

  void _consoleWrite(String msg) {
    window.console.log(msg);
  }

  void _alertWrite(String msg) {
    window.alert(msg);
  }

  void _screenWrite(String msg) {
    var div = new DivElement();
    div.innerHTML = msg;
    _node.insertBefore(div, _node.nodes.first);
    if (_node.nodes.length > 20) {
      _node.nodes.last().remove();
    }
    show();
  }
}

main() {
  var l = new Logger('Ciccio');
  l.log('test');
}