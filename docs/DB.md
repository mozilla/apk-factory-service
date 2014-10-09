# Database Schema

## apk_metadata

| Field           | Type          | Null | Key | Default | Extra |
|-----------------|---------------|------|-----|---------|-------|
| id              | char(40)      | NO   | PRI | NULL    |       |
| version         | bigint(20)    | YES  |     | NULL    |       |
| manifest_url    | varchar(5000) | YES  |     | NULL    |       |
| manifest_hash   | char(40)      | YES  |     | NULL    |       |
| library_version | int(11)       | YES  |     | NULL    |       |
