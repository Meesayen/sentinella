// <pre>
//	sentinella.dart  0.6.0
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
//	Log Center may be freely distributed under the MIT license.
// </pre>


#import('dart:html');
#import('dart:json');


class LogCenter {
  var user;
  var app;
  var loginPage;
  var consolePage;
  Element console;
  var clearBtn;
  var logoutBtn;
  EventSource source;

  LogCenter() {
    loginPage = query('#login');
    consolePage = query('#sentinel');
    console = query('#console');
  }

  run() {
    consolePage.remove();
    user = window.localStorage['username'];
    if (user == null) {
      var loginBtn = query('#login .btn');
      query('#login input').focus();
      loginBtn.on.click.add((e) {
        var username = (query('#login input') as InputElement).value;
        if (username == null) {
          return;
        }
        user = username;
        window.localStorage['username'] = user;
        loginPage.remove();
        document.body.nodes.add(consolePage);
        _initButtons();
        logoutBtn.innerHTML = 'Logout: $user';
        logoutBtn.style.display = '';
        _initFilters();
        _fetchApps();
        connectStream();
      });
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/log-center/users', true);
      xhr.on.load.add((e) {
        if (xhr.status === 200) {
          _fillUsersList(JSON.parse(xhr.response));
        }
      });
      xhr.send(null);
    } else {
      loginPage.remove();
      document.body.nodes.add(consolePage);
      _initButtons();
      _initFilters();
      logoutBtn.innerHTML = 'Logout: $user';
      logoutBtn.style.display = '';

      _fetchApps();
      connectStream();
    }
  }

  connectStream() {
    if (source != null) {
      source.close();
    }
    _clearConsole();
    if (user == null || app == null) {
      source = new EventSource('/log-center/stream/dummy/dummy');
    } else {
      clearBtn.style.display = '';
      source = new EventSource('/log-center/stream/$user/$app');
      source.on.message.add((e) {
        _writeLog(JSON.parse(e.data));
      });
    }
    source.$dom_addEventListener('addapp', (e) {
      _addApp(JSON.parse(e.data)['app']);
    });
    source.on.error.add((e) {
      print('Error: $e');
    });
  }

  // Handlers
  _handleAppClick(e) {
    app = e.target.value;
    connectStream();
  }

  _handleClearClick(e) {
    _clearConsole();
    clearBtn.style.display = 'none';
  }

  _handleLogoutClick(e) {
    window.localStorage.remove('username');
    window.location = window.location.toString();
  }

  // Privates
  _fillUsersList(users) {
    var userList = query('#users');
    userList.style.display = 'none';
    for (final u in users) {
      var opt = new OptionElement(value: u);
      userList.nodes.add(opt);
    }
    userList.style.display = '';
  }

  _fetchApps() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/log-center/$user/apps', true);
    xhr.on.load.add((e) {
      if (xhr.status === 200) {
        _fillAppsList(JSON.parse(xhr.response));
      }
    });
    xhr.send(null);
  }

  _fillAppsList(apps) {
    var appsList = query('#apps');
    appsList.style.display = 'none';
    for (final a in apps) {
      var li = new LIElement();
      var input = new InputElement('radio');
      var label = new LabelElement();

      input.name = 'app';
      input.id = 'app-$a';
      input.value = a;
      input.on.click.add(_handleAppClick);

      label.attributes['for'] = 'app-$a';
      label.innerHTML = a;

      li.nodes.add(input);
      li.nodes.add(label);
      appsList.nodes.add(li);
    }
    appsList.style.display = '';
  }

  _addApp(app) {
    var appsList = query('#apps');
    appsList.style.display = 'none';
    var li = new LIElement();
    var input = new InputElement('radio');
    var label = new LabelElement();

    input.name = 'app';
    input.id = 'app-$app';
    input.value = app;
    input.on.click.add(_handleAppClick);

    label.attributes['for'] = 'app-$app';
    label.innerHTML = app;

    li.nodes.add(input);
    li.nodes.add(label);
    appsList.nodes.add(li);
    appsList.style.display = '';
  }

  _writeLog(data) {
    var log = new DivElement();
    var toScroll = false;
    log.dataset['user'] = data['user'];
    log.dataset['app'] = data['app'];
    log.classes.add('message');
    log.classes.add(data['type']);
    log.innerHTML = data['msg'];
    if (console.$dom_scrollHeight - console.$dom_offsetHeight < console.$dom_offsetTop) {
      toScroll = true;
    }
    console.insertBefore(log, console.nodes.last());
    if (toScroll) {
      console.$dom_scrollTop = console.$dom_scrollHeight;
    }
  }

  _clearConsole() {
    console.innerHTML = '';
  }

  _initFilters() {
    var filters = queryAll('#sentinel .filter input');
    for (final f in filters) {
      f.on.click.add((e) {
        var toScroll = false;
        if (console.$dom_scrollHeight - console.$dom_offsetHeight < console.$dom_offsetTop) {
          toScroll = true;
        }
        if (e.target.checked == true) {
          console.classes.add(e.target.dataset['filter']);
        } else {
          console.classes.remove(e.target.dataset['filter']);
        }
        if (toScroll) {
          console.$dom_scrollTop = console.$dom_scrollHeight;
        }
      });
      if (f.checked == false) {
        f.click();
      }
    }
  }

  _initButtons() {
    clearBtn = query('#btn-clear');
    logoutBtn = query('#btn-logout');
    print(clearBtn);
    clearBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
    clearBtn.on.click.add(_handleClearClick);
    logoutBtn.on.click.add(_handleLogoutClick);
  }
}

main() {
  new LogCenter().run();
}


















