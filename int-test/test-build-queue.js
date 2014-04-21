#!/usr/bin/env node

/**
 * The config module can only be initialized once,
 * so we need multiple test files which are each
 * executed by tap.
 */
var path = require('path');

var mysql = require('mysql');
var tap = require('tap');

var config = require('../lib/config');
var sha1 = require('../lib/sha1');

var configFiles = [
  path.join(__dirname, '../', 'config/default.js'),
  path.join(__dirname, '../', 'config/developer.js'),
  path.join(__dirname, 'config/build.js')
];

config.init({
  "config-files": configFiles.join(','),
});

var buildQueue = require('../lib/build_queue');
var log = {
  debug: function() {
    console.log(arguments);
  },
  info: function() {
    console.log(arguments);
  },
  warn: function() {
    console.log(arguments);
  },
  error: function() {
    console.log(arguments);
  }
};
//require('../test/common/mock_log');

var shouldExit = false;

tap.test("Build queue controls execution of building per manifest", function(test) {
  config.withConfig(function(config) {
    emptyBuildQueue(config, function() {
      var state1;
      buildQueue('state1', config, log, function(finishedCb) {
        test.equal(state1, undefined, 'This is the first piece of work to run');
        state1 = 1;
        finishedCb();
      });
      buildQueue('state1', config, log, function(finishedCb) {
        test.equal(state1, 1, 'This is the second piece of work to run');
        state1 = 2;
        finishedCb();
      });
      buildQueue('state1', config, log, function(finishedCb) {
        test.equal(state1, 2, 'This is the third piece of work to run');
        state1 = 3;
        finishedCb();
      });
      buildQueue('state1', config, log, function(finishedCb) {
        test.equal(state1, 3, 'This is the third piece of work to run');
        state1 = 4;
        finishedCb();
        testBuildQueueEmpty(test, config, function() {
          test.end();
        });
      });
    });
  });
});

tap.test("Build queue handles multiple manifest urls", function(test) {
  config.withConfig(function(config) {
    emptyBuildQueue(config, function() {
      var state1;
      var state2;
      var state3;
      test.equal(state1, undefined);
      buildQueue('state1', config, log, function(finishedCb) {
        setTimeout(function() {
          test.equal(state1, undefined, 'This is the first piece of state1 work to run');
          state1 = 1;
          setTimeout(function() {
            finishedCb();
          }, 300);
        }, 100);
      });
      buildQueue('state2', config, log, function(finishedCb) {
        test.equal(state2, undefined, 'This is the first piece of state2 work to run');
        state2 = 1;
        finishedCb();
      });
      buildQueue('state3', config, log, function(finishedCb) {
        setTimeout(function() {
          test.equal(state3, undefined, 'This is the first piece of state3 work to run');
          state3 = 3;
          finishedCb();
          // Give build queue time to clear it's lock
          setTimeout(function() {
            testBuildQueueEmpty(test, config, function() {
              // BEWARE: putting test.end here as this happens 500 millis in, fragile...
              test.end();
            });
          }, 100);
        }, 500);
      });
      buildQueue('state1', config, log, function(finishedCb) {
        test.equal(state1, 1, 'This is the second piece of state1 work to run');
        state1 = 2;
        finishedCb();
      });
      buildQueue('state2', config, log, function(finishedCb) {
        test.equal(state2, 1, 'This is the second piece of state2 work to run');
        state2 = 2;
        finishedCb();
      });
      buildQueue('state1', config, log, function(finishedCb) {
        test.equal(state1, 2, 'This is the third piece of state1 work to run');
        state1 = 3;
        finishedCb();
      });
    });
  });
});

tap.test("Multiple servers", function(test) {
  config.withConfig(function(config) {
    test.equal(config.buildQueuePollFrequencyInMilliseconds, 1000,
      'We poll every second');
    test.equal(config.buildQueueStalePeriod, 10 * 1000,
      'Stale builds are cleaned up after 10 seconds');

    doQuery("INSERT INTO apk_build_lock " +
      "(manifest_hash, manifest_url, last_modified) " +
      "VALUES ('" + sha1('failedBuild') + "', '" + 'failedBuild' +
      "', NOW())",
      config,
      function(err) {
        test.equal(false, !! err, 'we could fake a stale build');

        var state1 = null;

        buildQueue('failedBuild', config, log, function(finishedCb) {
          setTimeout(function() {
            test.equal(state1, null, 'State build lock expired');
            state1 = 1;
            finishedCb();
          }, 1000);
        });

        buildQueue('failedBuild', config, log, function(finishedCb) {
          setTimeout(function() {
            test.equal(state1, 1, 'Second build lock on failedBuild went through');
            state1 = 2;
            finishedCb();

            setTimeout(function() {
              test.end();
              shouldExit = true;
            }, 1000);
          });
        }, 2000);
      });
  });
});

setInterval(function() {
  if (shouldExit) process.exit(0);
}, 1000);


function emptyBuildQueue(config, cb) {
  var conn = mysql.createConnection(config.mysql);
  conn.connect();
  conn.query('DELETE FROM apk_build_lock', null, function(err, rows) {
    conn.end();
    cb();
  });
}

function testBuildQueueEmpty(test, config, cb) {
  var conn = mysql.createConnection(config.mysql);
  conn.connect();
  conn.query('SELECT * FROM apk_build_lock', null, function(err, rows) {
    conn.end();
    test.equal(false, !! err);
    test.equal(0, rows.length);
    cb();
  });
}

function doQuery(sql, config, cb) {
  var conn = mysql.createConnection(config.mysql);
  conn.connect();
  conn.query(sql, null, function(err, rows) {
    conn.end();
    cb(err, rows);
  });
}
