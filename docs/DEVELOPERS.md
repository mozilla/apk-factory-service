Developer Docs
==============

Requirements
------------

* NodeJS
* Java
* Ant
* Android SDK

Running the service

    cd builder
    ./run-server.sh

Options
-------

To override the bind address, use `VCAP_APP_HOST`

To override the port, use --port

    VCAP_APP_HOST=192.168.186.138 ./run-server.sh --port=8000


Useful Tools
------------

* Test Manifests http://testmanifest.com/