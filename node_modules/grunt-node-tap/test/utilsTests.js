"use strict";
var _ = require('lodash');
var test = require('tap').test;
var utils = require('../lib/utils.js');

test('arrayPick applies pick to all objects in an array', function (t) {
	var input = _.map(_.range(2), function (i) {
		return { id: i, name: 'Test' + i, testProp: 'Test' + i};
	});
	var expected = [
		{ id: 0, name: 'Test0'},
		{ id: 1, name: 'Test1'}
	];
	var result = utils.arrayPick(input, 'id', 'name');
	t.deepEqual(expected, result);
	t.end();
});

test('unary only applies one argument', function (t) {
	var fx = function (arg0, arg1) {
		t.ok(arg0, 'First arg should be defined');
		t.notOk(arg1, 'Second arg should not be defined');
		t.end();
	};
	utils.unary(fx)(1, 2);
});

test('noArgs does not apply arguments', function (t) {
	var fx = function (arg0, arg1) {
		t.notOk(arg0, 'First arg should not be defined');
		t.notOk(arg1, 'Second arg should not be defined');
		t.end();
	};
	utils.noArgs(fx)(1, 2);
});

test('get gets requested object property', function (t) {
	var o = {name: 'Test'};
	var name = utils.get('name')(o);
	t.equal(name, 'Test', 'Fetches the requested property');
	t.end();
});
