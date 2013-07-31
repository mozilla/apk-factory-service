module.exports = {


    "alarms": [],
    "audio-channel-normal": [],
    "audio-channel-content": [],
    "audio-channel-alarm": [],

    "audio-channel-notification": [],

    "browser": [],

    "contacts:readonly": ["android.permissions.READ_CONTACTS"],
    "contacts:readwrite": ["android.permissions.READ_CONTACTS",
                          "android.permissions.WRITE_CONTACTS"],
    "contacts:readcreate": ["android.permissions.READ_CONTACTS",
                          "android.permissions.WRITE_CONTACTS"],
    "contacts:createonly": ["android.permissions.WRITE_CONTACTS"],

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

    "geolocation": [ "android.permissions.ACCESS_COARSE_LOCATION",
                      "android.permissions.ACCESS_FINE_LOCATION" ],

    "mobilenetwork": [ "android.permissions.ACCESS_NETWORK_STATE",
                        "android.permissions.ACCESS_WIFI_STATE" ],

    "storage": [],
    "systemXHR": ["android.permissions.INTERNET"],

    "tcp-socket": [],

    // certified

};