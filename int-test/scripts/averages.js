var fs = require('fs');
var path = require('path');
var vm = require('vm');

var _ = require('underscore');
var optimist = require('optimist');
var mysql = require('mysql');

var argv = optimist
  .usage('Usage: $0 [OPTIONS]')

.option('config', {
  alias: 'c',
  "default": path.resolve(__dirname, '..', 'config', 'default.js')
})

.check(function(args) {
  // Admin Config
  if (false === fs.existsSync(args.config)) {
    throw new Error('Regression test run config file required, unable to use ' + args.config);
  }
})
  .argv;

var config = vm.createContext();
vm.runInContext(fs.readFileSync(argv.config), config, argv.config);

withDBConn(function(err, conn, fin) {
  if (!conn) throw new Error('no connection');
  conn.query('SELECT env_id, start_dt, finish_dt, apk_size, outdated ' +
    'FROM results WHERE status_code = 200 ORDER BY start_dt', [], function(err, rows) {
      if (err) throw new Error(err);
      fin();
      process.nextTick(function() {
        analyzeRows(rows);
      });
    });
});

var start;
var prev = null;
var last;
var window = [];

function analyzeRows(rows) {
  rows.forEach(function(row) {
    last = row;
    if (null === prev) {
      prev = row;
      start = row;
      window.push(row);
    } else {
      var diffMillis = row.start_dt - prev.start_dt;
      var cutoff = 5 * 60 * 1000;
      if (diffMillis > cutoff) {
        console.log('new period detected, processing ', start.start_dt, 'to', prev.start_dt);
        analyzeWindow(window.slice());
        start = row;
        prev = row;
        window = [row];

      } else {

        window.push(row);
      }
    }
    prev = row;
  });
  console.log('new period detected, processing ', start.start_dt, 'to', last.start_dt);
  analyzeWindow(window.slice());
}

function analyzeWindow(rows) {
  var first = rows[0];
  var last = rows[rows.length - 1];
  var dur = (last.start_dt - first.start_dt) / 1000 / 60;
  console.log('duration', dur);
  console.log(rows.length, 'successful requests at ', rows.length / dur, 'r/min');
}

var regressionDBConfig;

function withDBConn(cb) {
  if (!regressionDBConfig) {
    regressionDBConfig = _.extend({},
      config.mysql, {
        database: 'apk_factory_regression'
      });
  }

  var conn = mysql.createConnection(regressionDBConfig);
  try {
    conn.connect();
    cb(null, conn, function() {
      conn.end();
    });
  } catch (e) {
    cb(e);
  }
}
