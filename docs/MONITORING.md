The following endpoints are available for monitoring

## Controller

* / - 200
* /system/generator - Can we contact the generator deamon (203 or 409)
* /system/s3 - Can we contact S3 (203 or 409)

## Generator

* / - 200
* /system/signer - Can we contact the APK Signer deamon via /system/auth (203 or 409)

## Dashboards

[Mana documents](https://mana.mozilla.org/wiki/pages/viewpage.action?pageId=38547561#controller.apk.firefox.com&generator.apk.firefox.com%28APKFactoryService%29-Graphite.1) various dev / stage / production Dashboards.

![](https://graphite.shared.us-west-2.prod.mozaws.net/render/?3=&width=588&height=310&_salt=1406073710.78&areaMode=stacked&from=-2hours&target=stats.timers.apk-controller-release.response.dur.mean&target=stats.timers.apk-controller-release.response.dur.mean_90&target=stats.timers.apk-controller-release.response.dur.upper&title=Controller%20Request%20Times)

![](https://graphite.shared.us-west-2.prod.mozaws.net/render/?21=&width=588&height=310&_salt=1406073912.622&from=-2hours&title=Cache%20Hit%20to%20Miss&target=stats.apk-controller-release.apk-cache.hit&target=stats.apk-controller-release.apk-cache.miss&connectedLimit=)

![](https://graphite.shared.us-west-2.prod.mozaws.net/render/?width=590&height=314&_salt=1406074075.472&from=-2hours&title=Status%20Codes&target=stats_counts.apk-controller-release.response.200&target=stats_counts.apk-controller-release.response.203&target=stats_counts.apk-generator-release.response.200&target=stats_counts.apk-generator-release.response.203&target=stats_counts.apk-controller-release.response.404&target=stats_counts.apk-controller-release.response.503&target=stats_counts.apk-generator-release.response.404&target=stats_counts.apk-generator-release.response.503)

![](https://graphite.shared.us-west-2.prod.mozaws.net/render/?3=&width=588&height=310&_salt=1406074303.799&from=-2hours&target=stats.gauges.apk-generator-release.apk-build-active.count&target=stats.gauges.apk-generator-review.apk-build-active.count&title=Concurrent%20Builds)