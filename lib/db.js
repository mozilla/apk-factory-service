/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var mysql = require('mysql');

var lru = require('ttl-lru-cache')({
  maxLength: 5000
});
var withConfig = require('./config').withConfig;

var SELECT_SQL = "SELECT id, version, manifest_url, manifest_hash, " +
  "library_version FROM apk_metadata " +
  "WHERE id = ?";

var INSERT_SQL = "INSERT INTO apk_metadata (id, version, manifest_url, " +
  "manifest_hash, library_version) VALUES " +
  "(?, ?, ?, ?, ?)";

var UPDATE_SQL = "UPDATE apk_metadata SET " +
  "version = ?, manifest_hash = ?, library_version = ? " +
  "WHERE id = ? ";

var CLEAR_CACHED_APK_SQL = "DELETE FROM apk_metadata WHERE id = ?";

var CLEAR_ALL_APKS_SQL = "DELETE FROM apk_metadata";

var AQUIRE_LOCK_SQL = "INSERT INTO apk_build_lock (manifest_hash, manifest_url, last_modified) " +
  "VALUES (?, ?, ?)";

var RELEASE_LOCK_SQL = "DELETE FROM apk_build_lock WHERE manifest_hash = ?";

var SELECT_LOCKS_SQL = "SELECT manifest_hash, manifest_url, last_modified FROM apk_build_lock";

withConfig(function(config) {
  var log = require('./logging')(config);
  var HASH_TTL = config.manifestCacheTTL * 1000;
  var pool = mysql.createPool(config.mysql);
 
  /*
   * No DB Pooling - KISS. We'll switch to pooling if DB becomes a perf issue.
   */
  exports.saveMetadata = function(metadata, config, cb) {
    log.info('DB clearing lru for ' + metadata.id);
    lru.clear(metadata.id);
    var params = [
      metadata.id,
      metadata.version,
      metadata.manifest_url,
      metadata.manifest_hash,
      metadata.library_version
    ];
    try {
      pool.query(INSERT_SQL, params, function(err /*, rows, fields*/ ) {
        return cb(err);
      });
    } catch (e) {
      cb(e);
    }
  };

  exports.updateMetadata = function(metadata, config, cb) {
    log.info('DB clearing lru for ' + metadata.id);
    lru.clear(metadata.id);
    var params = [
      metadata.version,
      metadata.manifest_hash,
      metadata.library_version,
      metadata.id
    ];
    try {
      pool.query(UPDATE_SQL, params, function(err /*, rows, fields*/ ) {
        return cb(err);
      });
    } catch (e) {
      cb(e);
    }
  };

  exports.getMetadata = function(id, config, cb) {
    var metadata = lru.get(id);
    if (undefined !== metadata) {
      log.info('DB cache hit for ' + id);
      return cb(null, metadata);
    }
    try {
      pool.query(SELECT_SQL, [id], function(err, rows /*, fields*/ ) {
        var results = null;
        if (err) {
          return cb(err);
        }
        if (rows && rows.length > 0) {
          results = rows[0];
        }
        log.info('DB cache miss, setting into cache ' + id);
        lru.set(id, results, HASH_TTL);
        return cb(null, results);
      });
    } catch (e) {
      cb(e);
    }
  };

  exports.clearApk = function(manifestHash, config, cb) {
    log.info('DB ADMIN clearAPK ' + manifestHash);
    var params = [ manifestHash ];
    try {
      pool.query(CLEAR_CACHED_APK_SQL, params, function(err, rows) {
        var affected = 0;
        if (rows && rows.affectedRows) {
          affected = rows.affectedRows;
        }
        return cb(err, affected);
      });
    } catch (e) {
      cb(e);
    }    
  };

  exports.clearAllApks = function(config, cb) {
    log.info('DB ADMIN clearAllAPks called');
    try {
      pool.query(CLEAR_ALL_APKS_SQL, [], function(err, rows) {
        var affected = 0;
        if (rows && rows.affectedRows) {
          affected = rows.affectedRows;
        }
        return cb(err, affected);
      });
    } catch (e) {
      cb(e);
    }    
  };

  exports.aquireBuildLock = function(manifestHash, url, config, cb) {
    log.info('DB Aquiring build lock ' + manifestHash);
    var params = [ manifestHash, url, new Date() ];
    try {
      pool.query(AQUIRE_LOCK_SQL, params, function(err /*, rows, fields*/ ) {
        if (err) reportAquireError(manifestHash, err);
        return cb(err);
      });
    } catch (e) {
      reportAquireError(manifestHash, e.toString());
      cb(e);
    }    
  };

  exports.releaseBuildLock = function(manifestHash, config, cb) {
    log.info('DB Releasing build lock ' + manifestHash);
    var params = [ manifestHash ];
    try {
      pool.query(RELEASE_LOCK_SQL, params, function(err, rows) {
        if (err) {
          log.info('ERROR Releasing lock ' + manifestHash + ' ' + err);
        } else {
          log.info('DB Released ' + rows.affectedRows + ' locks');
        }
        if (cb) cb(err);
      });
    } catch (e) {
      if (cb) cb(e);
    }
  };

  function reportAquireError(manifestHash, err) {
    log.info('Unable to aquire build lock on ' + manifestHash + ' ' + err);
  }

  exports.activeBuildLocks = function(config, cb) {
    try {
      pool.query(SELECT_LOCKS_SQL, null, function(err, rows) {
        return cb(err, rows);
      });
    } catch (e) {
      cb(e);
    }
  };
});
