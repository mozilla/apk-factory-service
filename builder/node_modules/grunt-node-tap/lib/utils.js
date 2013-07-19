"use strict";
var _ = require('lodash');

function unary(fn) {
	if (fn.length === 1) return fn;
	return function (args) {
		return fn.call(this, args);
	};
}

function arrayPick() { // arr, props
	var args = Array.prototype.slice.call(arguments);
	var arr = args.shift();
	var props = args;

	return _.map(arr, function (i) {
		return _.pick.apply(null, [i].concat(props));
	});
}

function noArgs(fn) {
	return function () {
		return fn.call(this);
	};
}

function callWithArgs(fn) {
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return function() {
			fn.apply(this, args);
		};
	};
}

function get(key) {
	return function (obj) {
		return obj[key];
	};
}

module.exports = {
	unary: unary,
	arrayPick: arrayPick,
	noArgs: noArgs,
	get: get,
	noop: function () {},
	callWithArgs: callWithArgs
};
