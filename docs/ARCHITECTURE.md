# APK Factory Service's Architecture

![](https://www.lucidchart.com/publicSegments/view/52a11164-ae24-4e2d-83fb-3fba0a004254/image.png)

This service processes HTTP requests directly from the following clients:
* Firefox for Android
* Developers using a CLI

This traffic may indirectly come from the Marketplace, via a daily update check, or directly from user action.

A load balancer will hand traffic to an nginx web server which will proxy traffic to our controller deamon.
There can be N controller deamons active, to scale the service horizontally.

## Install APK

The controller will check the APK Cache to see if it already has built the APK.
If so, it is directly returned to the client.

If not, the OWA Downloader retrieves some or all of the following:
* OWA Manifest
* OWA Packaged App (zip file)
* OWA Icons

These requests are made through an HTTP caching layer (Squid reverse proxy).
These requests would go to any place an OWA is hosted, such as:
* our Marketplace
* another Marketplace
* a application's website

These results are sent via a multipart HTTP Post to the Generator web service.
This work request goes through a load balancer layer, so that N Generator deamons
can be run.

The Generator ensures that an Android Certificate is available for the appliation.
If it doesn't have one, one is auto-generated.

A skeleton APK Project is created on disk.

Inputs are modified from OWA to Android standards.

Inputs are written to disk and used to fill in the APK Project template.

ant is invoked with some arugments and uses files on disk to build and sign the APK.

The resulting APK is sent in the HTTP response to the Controller.
The working build directory is removed.

The Controller updates the APK Cache with the APK file.
Finally, the APK File is returned to the client.

## Updated Versions Check

A second core web service API is a way for clients to provide a list of OWA Manifests paired
with version numbers. The list of all installed apps is sent in a JSON encoded HTTP POST.
The service uses the OWA Downloader, the APK Cache and a database of APK Metadata to
determine the list of APKs which have newer versions.

Metadata stored in the APK Metadata DB:
* manifest url
* digest of manifest contents
* digest of packaged app (optional)
* version number
* library version number
* current library version number

version number is an arbitrary (controlled by the APK Factory Service) incrementing integer.

library version number tracks the Apk Factory Library, the Java support code for APKs.
If that version is bumped (say for an important security patch) this will cause
existing APKs to seem  out of date.

If any of the digests or library version numbers are out of date,
then the service resonds with that apps manifest url in it's output.

The client can then make a subsequent Install APK request.

## Build APK for Developer

## Implementation Details

OWA Versions are useless

Builds lock on a per-manifest basis.