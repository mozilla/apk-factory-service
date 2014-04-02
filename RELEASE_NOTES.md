# release-2014-04-02-01 (4ba21e1a40)
* (db migration) Bug#976170 Build queue for horizontal scaling
* (config) Bug#986551 Admin CLI
* Bug#988644 Support debug APKs for review instances
* Bug#988741 If we can't find an app, it isn't out of date.
* (dev only) Support node debugger

## DB Migration

    mysql < docs/db/schema_up_002.sql

## Config

The admin CLI requires new Controller config and adding the Hawk secret to mana.

* [adminHawk](https://github.com/mozilla/apk-factory-service/blob/4ba21e1a40/docs/CONFIG.md#adminHawk)
* [hawkPublicControllerServerPort](https://github.com/mozilla/apk-factory-service/blob/4ba21e1a40/docs/CONFIG.md#hawkpubliccontrollerserverport)

## Rollback Instructions

Rollback Schema.

    mysql < docs/db/schema_down_002.sql

Remove new Config.

# release-2014-03-25-00 (0cdcfa3a42)
* First deployment