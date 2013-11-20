"use strict";
var test = require('tap').test;

test("Failing test 0", function (t) {
	t.ok(false, "false is ok");
	t.end();
});

test("Failing test 1", function (t) {
	t.notEqual(1, 1, "1 does not equal 1");
	t.end();
});
