CREATE DATABASE apk_factory CHARACTER SET utf8 COLLATE utf8_general_ci;
USE apk_factory;
CREATE TABLE apk_metadata (
  id CHAR(40) NOT NULL,
  version INT,
  manifest_url VARCHAR(5000),
  manifest_hash CHAR(40),
  package_hash CHAR(40),
  library_version INT,
  PRIMARY KEY(id)
);