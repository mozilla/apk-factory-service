USE apk_factory_regression;

CREATE TABLE env (
  id CHAR(40) NOT NULL,
  name VARCHAR(140),
  endpoint_url VARCHAR(5000),
  PRIMARY KEY(id)
);

INSERT INTO env (id, name, endpoint_url) VALUES
("dev-release", "Dev (release)", "https://apk-controller.dev.mozaws.net"),
-- ("dev-review", "Dev (review)", "https://apk-controller-review.dev.mozaws.net"),
("stage-release", "Stage (release)", "https://apk-controller.stage.mozaws.net"),
("stage-review", "Stage (review)", "https://apk-controller-review.stage.mozaws.net"),
("prod-release", "Production (release)", "https://controller.apk.firefox.com"),
("prod-review", "Production (review)", "https://apk-controller-review.stage.mozaws.net");

CREATE TABLE owa (
  id CHAR(40) NOT NULL,
  name VARCHAR(140),
  manifest_url VARCHAR(5000),
  PRIMARY KEY(id)
);

CREATE TABLE results (
  id INT NOT NULL AUTO_INCREMENT,
  env_id CHAR(40) NOT NULL,
  owa_id CHAR(40) NOT NULL,
  start_dt TIMESTAMP NOT NULL,
  finish_dt TIMESTAMP,
  hosted BOOLEAN,
  valid_jar BOOLEAN,
  apk_size INT,
  version INT,
  outdated BOOLEAN,
  status_code SMALLINT,
  error VARCHAR(5000),
  PRIMARY KEY(id),
  FOREIGN KEY(env_id) REFERENCES env(id),
  FOREIGN KEY(owa_id) REFERENCES owa(id)
);

INSERT INTO owa (id, name, manifest_url) VALUES
("6c1d55b728f1f5bb39f413cff79887e324296e96", "Twitter", "https://mobile.twitter.com/cache/twitter.webapp");