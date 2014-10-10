// <pre>
//  sentinella.js  1.0.0
//
//
//    _/_/_/  _/_/      _/_/      _/_/      _/_/_/    _/_/_/  _/    _/    _/_/    _/_/_/
//   _/    _/    _/  _/_/_/_/  _/_/_/_/  _/_/      _/    _/  _/    _/  _/_/_/_/  _/    _/
//  _/    _/    _/  _/        _/            _/_/  _/    _/  _/    _/  _/        _/    _/
// _/    _/    _/    _/_/_/    _/_/_/  _/_/_/      _/_/_/    _/_/_/    _/_/_/  _/    _/
//                                                              _/
//                                                         _/_/
//
//  (c) 2012 Federico Giovagnoli (meesayen)
//  Log Center may be freely distributed under the MIT license.
// </pre>

/* global io */

import { session } from '../core/utils.es6';
import { setLogger, getLogger } from '../core/logger.es6';
import DomHandler from '../core/dom-handler.es6';
import Store from '../core/store.es6';
import storeRegistry from '../config/storeRegistry.es6';
import AppList from '../elements/app-list.es6';
import UserCarousel from '../elements/user-carousel.es6';
import Console from '../elements/console.es6';

var store = new Store(storeRegistry);

class Sentinella extends DomHandler {
  constructor() {
    this._root = document.body;
    this._sourceUrl = '/log-center/stream';
    this.user = null;
    this.objectMaps = [];
    this.logCenterPage = this.nodes.one('#sentinel');
    this.console = new Console({
      hook: '#console'
    });
    this.appList = new AppList({
      hook: '#apps'
    });
    this.appList.on('item:click', this._onAppClick.bind(this));
    this.appList.on('filter:click', this._onAppFilterClick.bind(this));
    this.clearBtn = this.logCenterPage.querySelector('#btn-clear');
    // this.clearBtn.style.display = 'none';
    this.clearBtn.addEventListener('click', this._onClearClick.bind(this));
  }
  run() {
    this.user = session.get('username');
    store.get('users', { username: this.user })
      .then(this._onUserExist.bind(this));
  }

  connectStream(user, app) {
    if (!this._socket) {
      var socket = this._socket = io.connect(window.location.origin);
      socket.on('sentinel:new-log', data => {
        if (this.user === data.user) {
          if (this.app === data.app) {
            this.console.write(data);
          }
          this.appList.updateIndicators(data);
        }
      });
      socket.on('sentinel:new-app', data => {
        if (this.user === data.user) {
          this.appList.add(data.app);
        }
      });
      socket.on('sentinel:new-user', data => {
        this.userCarousel.add(data.user);
      });
    }
    this.console.clear();
    this._socket.emit('console:disconnection');
    this._socket.emit('console:connection', {
      user: user,
      app: app
    });
  }


  // Events handlers ---------------------------------------------------------

  _onUserExist(user) {
    if (!user.exists) {
      this.user = 'global';
      session.del('username');
    }
    this.userCarousel = new UserCarousel({
      currentUser: this.user === 'global' ? null : this.user,
      dataSource: 'users'
    });
    this.userCarousel.on('item:click', this._onUserClick.bind(this));
    this.nodes.one('.user-box').appendChild(this.userCarousel.root);

    this.appList.user = this.user;
    this.connectStream(this.user, null);
  }
  _onAppClick(item) {
    this.app = item.id;
    this.connectStream(this.user, this.app);
  }
  _onAppFilterClick(data) {
    this.console.setFilters(data.filterStates);
  }
  _onClearClick() {
    this.console.clear();
  }
  _onUserClick(user) {
    if (this.user === user) {
      return;
    }
    this.user = user;
    session.set('username', user);
    this.appList.user = this.user;
    this.connectStream(this.user, null);
  }
}


/* Launch app */
window.log = getLogger();
window.setLogger = setLogger;
window.getLogger = getLogger;

var app = new Sentinella();
app.run();
