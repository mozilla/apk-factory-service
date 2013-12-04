#!/usr/bin/env node

/**
 * The config module can only be initialized once,
 * so we need multiple test files which are each
 * executed by tap.
 */
var path = require('path');

var tap = require('tap');

process.env['FILESYSTEM_BUILD'] = '/tmp/test';
process.env['FILESYSTEM_CACHE'] = '/tmp/test';
process.env['CONFIG_FILES'] = path.join(__dirname, 'data', 'default_config.js');

tap.test("A single config works as expected", function(test) {
  var config = require('../lib/config');
  config(function(conf) {
    test.deepEqual(conf, {
      foo: 'bar',
      buz: 'baz',
      huh: undefined,
      animals: { cat: 'Snowball', dog: 'Spot', lamma: 'Rojer' },
      bar: 42,
      buildDir: "/tmp/test",
      cacheDir: "/tmp/test",
      force: undefined,
      bind_address: undefined,
      controller_server_port:  undefined
    }, "Deep Equals of configuration object");
    test.end();
  });
});