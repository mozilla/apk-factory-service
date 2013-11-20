#!/usr/bin/env node

/**
 * The config module can only be initialized once,
 * so we need multiple test files which are each
 * executed by tap.
 */
var path = require('path');

var tap = require('tap');

process.env['CONFIG_FILES'] = [
  path.join(__dirname, 'data', 'default_config.js'),
  path.join(__dirname, 'data', 'override_config.js')
].join(',');

tap.test("Multiple configs works as expected", function(test) {
  require('../lib/config')(function(conf) {
    test.deepEqual(conf, {
      foo: 'FOOBAR5000', // instead of 'bar'
      newprop: 12345, // new from override
      buz: 'baz',
      huh: undefined,
      animals: { cat: 'Snowball', dog: 'Spot', lamma: 'Rojer' },
      bar: 42
    }, "Deep Equals of configuration object");
    test.end();
  });
});