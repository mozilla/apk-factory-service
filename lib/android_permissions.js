/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = {


    "alarms": [],
    "audio-channel-normal": [],
    "audio-channel-content": [],
    "audio-channel-alarm": [],

    "audio-channel-notification": [],

    "browser": [],

    "contacts:readonly": ["android.permission.READ_CONTACTS"],
    "contacts:readwrite": ["android.permission.READ_CONTACTS",
                          "android.permission.WRITE_CONTACTS"],
    "contacts:readcreate": ["android.permissionsREAD_CONTACTS",
                          "android.permission.WRITE_CONTACTS"],
    "contacts:createonly": ["android.permission.WRITE_CONTACTS"],

    "desktop-notification": [],

    "device-storage:music:readonly": [],
    "device-storage:music:readwrite": [],
    "device-storage:music:readcreate": [],
    "device-storage:music:createonly": [],

    "device-storage:pictures:readonly": [],
    "device-storage:pictures:readwrite": [],
    "device-storage:pictures:readcreate": [],
    "device-storage:pictures:createonly": [],

    "device-storage:video:readonly": [],
    "device-storage:video:readwrite": [],
    "device-storage:video:readcreate": [],
    "device-storage:video:createonly": [],

    "device-storage:sdcard:readonly": [],
    "device-storage:sdcard:readwrite": [],
    "device-storage:sdcard:readcreate": [],
    "device-storage:sdcard:createonly": [],

    "fmradio": [],

    "geolocation": [ "android.permission.ACCESS_COARSE_LOCATION",
                      "android.permission.ACCESS_FINE_LOCATION" ],

    "mobilenetwork": [ "android.permission.ACCESS_NETWORK_STATE",
                        "android.permission.ACCESS_WIFI_STATE" ],

    "storage": [],
    "systemXHR": ["android.permission.INTERNET"],

    "tcp-socket": ["android.permission.INTERNET"],

    // certified

  };