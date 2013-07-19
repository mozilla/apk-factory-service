package org.mozilla.fennec.dummy;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

public class WebAppInstallReceiver extends BroadcastReceiver {

    private WebAppRegistry mRegistry;

    @Override
    public void onReceive(Context context, Intent intent) {
        String packageName = getPackageName(intent.getData());

        if (intent.getBooleanExtra(Intent.EXTRA_REPLACING, false)) {
            // we don't need to do anything - because the app is being removed
            // then added.
            Logger.i("Replacing: " + packageName);
            return;
        }

        boolean isAdded = Intent.ACTION_PACKAGE_ADDED.equals(intent.getAction());


        Logger.i("Processing: " + packageName);
        if (isAdded) {
            getRegistry(context).addApk(context, packageName);
        } else { // is removed
            getRegistry(context).removeApk(context, packageName);
        }

        getRegistry(context).log(context);
    }

    private String getPackageName(Uri uri) {
        return uri.toString().substring("package:".length());
    }

    public WebAppRegistry getRegistry(Context context) {
        if (mRegistry == null) {
            mRegistry = new WebAppRegistry();
            mRegistry.rebuildRegistry(context);
        }
        return mRegistry;
    }

}
