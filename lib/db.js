var mysql = require('mysql');
/**
 * No DB Pooling - KISS. We'll switch to pooling if DB becomes a perf issue.
 */
exports.saveMetadata = function(metadata, config, cb) {
  var conn = mysql.createConnection(config.mysql);
  try {
    conn.connect();
    conn.query("INSERT INTO apk_metadata (id, version, manifest_url, manifest_hash, package_hash, library_version) VALUES (SHA1('http://example.com/'), 1386616177212, 'http://example.com/', SHA1('foo'), SHA1('bar'), 22)", function(err, rows, fields) {
    conn.end();
    return cb(err);
  });
  } catch(e) {
    console.error(e);
    cb(err);
  }
};

exports.getMetadata = function(id, config, cb) {
  var conn = mysql.createConnection(config.mysql);
  try {
    conn.connect();
    conn.query("SELECT id, version, manifest_url, manifest_hash, package_hash, library_version FROM apk_metadata WHERE id = SHA1('http://example.com/')", function(err, rows, fields) {
    conn.end();
    return cb(err, rows);
  });
  } catch(e) {
    console.error(e);
    cb(err);
  }
};