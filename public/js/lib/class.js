/*!
 * Class.js v0.2
 *
 * Copyright 2013, Federico Giovagnoli <mailto:gvg.fede@gmail.com>
 * Released under the MIT license
 */


define(function() {
	var _publicMethod = function(value) {
		return {
			value: value,
			configurable: true,
			enumerable: true,
			writable: true
		};
	};
	var _privateMethod = function(value) {
		return {
			value: value,
			configurable: false,
			enumerable: false,
			writable: false
		};
	};
	var _propertyAccessor = function(accessors) {
		var
			get = accessors.get || function() {},
			set = accessors.set || function() {};
		return {
			get: get,
			set: set,
			enumerable: true,
			configurable: false
		}
	};
	var _parseProp = function(prop, value) {
		if (prop.substring(0, 1) === '_') {
			return _privateMethod(value);
		} else {
			return _publicMethod(value);
		}
	};

	var Class = function(props) {
		var
			newClassProps = {},
			parent = props.parent ? props.parent.prototype : Object.prototype,
			accessors = props.accessors,
			newClass = props.constructor || function() {};
		delete props.parent;
		delete props.constructor;
		delete props.accessors;

		for (var k in accessors) {
			newClassProps[k] = _propertyAccessor(accessors[k]);
		}
		for (var k in props) {
			newClassProps[k] = _parseProp(k, props[k]);
		}
		newClass.prototype = Object.create(parent, newClassProps);

		return newClass;
	};

	return Class;
});
