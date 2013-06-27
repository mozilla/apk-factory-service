package org.mozilla.fennec.dummy;

import android.app.Application;

public class DummyFennecApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        new WebAppRegistry().rebuildRegistry(this);
    }
}
