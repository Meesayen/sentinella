/*!
 * dom-handler.js 0.2.1
 * A simple dom handler class
 *
 * Copyright 2013, Federico Giovagnoli <mailto:gvg.fede@gmail.com>
 * Released under the MIT license
 */


import { lookup } from './utils.es6';
import { renderSync, renderContentSync } from './tpl.es6';
import EventEmitter from './eventemitter.es6';

var
  _slice = Array.prototype.slice;


export default class DomHandler extends EventEmitter {
  constructor() {
    this.__nodesApi = null;
    this.root = renderSync(this._template, this._model);

    // bindings cache, used to unbind event handlers during a 'clear' call.
    this._DomHandler_bindingsCache = {};

    this._DomHandler_manageBindings();
  }

  get root() {
    return this._root;
  }
  set root(frag) {
    this._root = frag;
  }

  get nodes() {
    var _this = this;
    return this.__nodesApi || (this.__nodesApi = {
      one: (selector) => {
        return _this._root.querySelector(selector);
      },
      every: (selector, pureNodeList) => {
        if (pureNodeList === true) {
          return _this._root.querySelectorAll(selector);
        } else {
          return _slice.call(_this._root.querySelectorAll(selector), 0);
        }
      },
      add: (element) => {
        _this._root.appendChild(element);
      },
      del: (element) => {
        _this._root.removeChild(element);
      },
      clear: () => {
        _this._root.innerHTML = '';
      }
    });
  }

  get model() {
    return this._model;
  }
  set model(newModel) {
    this._model = newModel;
    this.refresh();
  }

  /* Must be overridden, not shadowed. */
  refresh() {
    this._DomHandler_clear();
    var children = renderContentSync(this._template, this._model);
    this._root.appendChild(children);
    this._DomHandler_manageBindings();
  }

  // DomHandler private methods. Inheriting classes should not use these
  // methods directly.
  _DomHandler_manageBindings() {
    var
      boundElements = this.nodes.every('[data-on]'),
      domEvent = '',
      handlerPath = '',
      handler = null,
      dataOn = '',
      bindings = null,
      bindingParts;
    boundElements.forEach(el => {
      dataOn = el.dataset.on;
      bindings = dataOn.split(' ');
      this._DomHandler_bindingsCache[dataOn] = [];
      bindings.forEach(binding => {
        bindingParts = binding.split(':');
        domEvent = bindingParts[0];
        handlerPath = bindingParts[1];

        // TODO check destructuring now works within functions.
        // [domEvent, handlerPath] = binding.split(':');

        handler = function(_handlerPath, e) {
          this._DomHandler_fire(_handlerPath, e);
        }.bind(this, handlerPath);

        // each bound html element should have a globally unique data-on value
        this._DomHandler_bindingsCache[dataOn].push(handler);
        el.addEventListener(domEvent, handler);
      });
    });
  }

  _DomHandler_fire(handlerPath, e) {
    var eventHandler = lookup(this.events, handlerPath);
    eventHandler && this[eventHandler].call(this, e);
  }

  _DomHandler_clear() {
    var
      bindings = this._DomHandler_bindingsCache,
      el = null;
    Object.keys(bindings).forEach(k => {
      el = this.nodes.one(`[data-on="${k}"]`);
      bindings[k].forEach(handler => el.removeEventListener(handler));
    });
    var firstchild;
    while ((firstchild = this._root.firstChild)) {
      this._root.removeChild(firstchild);
    }
  }
}
