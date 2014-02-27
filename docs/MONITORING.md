The following endpoints are available for monitoring

## Controller

* / - 200
* /system/generator - Can we contact the generator deamon (203 or 409)
* /system/s3 - Can we contact S3 (203 or 409)

## Generator

* / - 200
* /system/signer - Can we contact the APK Signer deamon via /system/auth (203 or 409)
* /system/authz - Is Hawk configured between the Generator and APK Signer (200 or 401)
