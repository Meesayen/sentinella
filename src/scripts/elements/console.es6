import DomHandler from '../core/dom-handler.es6';
import { renderSync, renderStringSync } from '../core/tpl.es6';

var CONSOLE_INITIAL_STATE = [
  '<div class="padding-top"></div>',
  '<div class="void"></div>'
].join('');

var padNumber = (num) => {
  if (num < 10) {
    return '0' + num;
  }
  return num;
};

export default class Console extends DomHandler {
  constructor(o = {}) {
    if (o.hook) {
      this._root = document.querySelector(o.hook);
    }
    if (!this._root) {
      this._root = document.createElement('div');
      this._root.id = 'console';
    }
    this.objectMaps = [];
    this._referenceBox = document.querySelector('.reference-box');
    this._root.addEventListener('click', this._expandReference.bind(this));
    this.clear();
  }
  write(data) {
    var
      toScroll = false,
      root = this._root;

    data.msg = this._parseMessageChunks(data.chunks);
    data.formatDate = this._formatDate;
    var log = renderSync('log-message', data);
    if ((root.scrollHeight - root.offsetHeight) < (root.scrollTop)) {
      toScroll = true;
    }
    root.insertBefore(log, root.lastChild);
    if (toScroll) {
      root.scrollTop = root.scrollHeight;
    }
  }
  clear() {
    this._root.innerHTML = CONSOLE_INITIAL_STATE;
    this._referenceBox.classList.add('hidden');
  }
  setFilters(filterStates) {
    this._setFilters(filterStates);
  }
  _formatDate(timestamp) {
    var
      date = new Date(timestamp),
      d = padNumber(date.getDate()),
      m = padNumber(date.getMonth() + 1),
      y = date.getFullYear(),
      hh = padNumber(date.getHours()),
      mm = padNumber(date.getMinutes()),
      ss = padNumber(date.getSeconds());
    return `[${[d, m, y].join('-')} ${[hh, mm, ss].join(':')}]`;
  }
  _parseMessageChunks(data) {
    var
      messageChunks = [],
      objectMap = [],
      logId = this.objectMaps.length;
    data.forEach(item => {
      if (typeof item === 'number' ||
          typeof item === 'string' ||
          typeof item === 'boolean' ||
          !item) {
        messageChunks.push('' + item);
      } else {
        var id = objectMap.length;
        objectMap.push(item);
        messageChunks.push(renderStringSync('log-reference', {
          logId: logId,
          id: id,
          label: item instanceof Array ? '[array]' : '[object]'
        }, true));
      }
    });
    this.objectMaps.push(objectMap);
    return messageChunks.join(' ');
  }
  _expandReference(e) {
    var
      refEl = document.elementFromPoint(e.pageX, e.pageY),
      refData = refEl.dataset,
      refBox = this._referenceBox;

    if (refEl.classList.contains('reference')) {
      refBox.innerHTML = '';
      refBox.innerHTML = renderStringSync('log-object', {
        map: this.objectMaps[refData.logId][refData.id]
      }, true);
      refBox.classList.remove('hidden');
    } else {
      refBox.classList.add('hidden');
    }
  }
  _setFilters(filterStates) {
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
}
