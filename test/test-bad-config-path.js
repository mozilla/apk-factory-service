#!/usr/bin/env node

/**
 * The config module can only be initialized once,
 * so we need multiple test files which are each
 * executed by tap.
 */
var path = require('path');

var tap = require('tap');

var config = require('../lib/config');

process.env['FILESYSTEM_BUILD'] = '/tmp/test';

tap.test("A single config works as expected", function(test) {
  process.env['CONFIG_FILES'] = 'does-not-exist.js';
  config.init({
    "config-files": process.env['CONFIG_FILES'],
    varPath: "/var"
  });
  var withConfig = config.withConfig;
  try {
    withConfig(function(conf) {
      // We never get here.
    });
  } catch(e) {
    test.equal(e.code, "ENOENT", "Bad config throws an Error");
    test.end();
  }
});