"use strict";
var test = require('tap').test;

test("Passing test 0", function (t) {
	t.ok(true, "true is ok");
	t.end();
});

test("Passing test 1", function (t) {
	t.equal(1, 1, "1 equals 1");
	t.end();
});
