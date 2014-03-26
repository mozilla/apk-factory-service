USE apk_factory;

CREATE TABLE apk_build_lock (
  manifest_hash CHAR(40),
  last_modified TIMESTAMP,
  PRIMARY KEY(manifest_hash)
);