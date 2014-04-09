/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore');
var mysql = require('mysql');

var regressionDBConfig;

function withConn(config, cb) {
  if (! regressionDBConfig) {
    regressionDBConfig = _.extend({},
                                  config.mysql, 
                                  {database: 'apk_factory_regression'});
  }

  console.log('regressionDBConfig', regressionDBConfig);
  
  var conn = mysql.createConnection(regressionDBConfig);
  try {
    conn.connect();
    cb(null, conn);
  } catch (e) {
    cb(e);
  }
}

function handleConnErr(errCb, cb) {
  return function(err, conn) {

    if (err) {
      return errCb(err);
    } else {
      return cb(conn);
    }
  };
}

function querySendRows(conn, cb) {
  return function(err, rows) {
    conn.end();
    if (err) {
      return cb(err);
    }
    return cb(null, rows);
  };
}

exports.envs = function(config, cb) {
  withConn(config, handleConnErr(cb, function(conn) {
    if (! conn) throw new Error('no connection');
    conn.query('SELECT id, name, endpoint_url FROM env', [], querySendRows(conn, cb));
  }));
};

exports.owas = function(config, cb) {
  withConn(config, handleConnErr(cb, function(conn) {
    if (! conn) throw new Error('no connection');
    conn.query('SELECT id, name, manifest_url FROM owa', [], querySendRows(conn, cb));
  }));
};

exports.saveResult = function(config, result, cb) {
  withConn(config, handleConnErr(cb, function(conn) {
    conn.query('INSERT INTO results ' +
               '(env_id, owa_id, start_dt, finish_dt, hosted, ' +
               'valid_jar, apk_size, status_code, error) ' +
               'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
               [
                 result.envId,
                 result.owaId,
                 result.start,
                 result.finish,
                 result.hosted,
                 result.validJar,
                 result.apkSize,
                 result.statusCode,
                 result.err
               ], function(err) {
                 conn.end();
                 cb(err);                 
               });  
  }));
};

exports.bulkAddOWA = function(config, owas, cb) {
  console.log('INSERTING ', owas);
    withConn(config, handleConnErr(cb, function(conn) {
      conn.query('INSERT INTO owa ' +
               '(id, name, manifest_url) VALUES ?',
               [owas], function(err) {
                 console.log('DB says', err);
                 conn.end();
                 cb(err);
               });  
  }));
};