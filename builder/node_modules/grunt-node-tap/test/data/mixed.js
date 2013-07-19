"use strict";
var test = require('tap').test;

test("Passing test 0", function (t) {
	t.ok(true, "true is ok");
	t.end();
});

test("Failing test 1", function (t) {
	t.notEqual(1, 1, "1 does not equal 1");
	t.end();
});
