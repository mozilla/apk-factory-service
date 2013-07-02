package org.mozilla.fennec.dummy;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.FileNotFoundException;

public class PackagedAppRunReceiver extends BroadcastReceiver {
    public void onReceive(Context context, Intent intent) {

        Logger.i("invoke packaged app run receiver : " + intent.getStringExtra("PACKAGE_NAME"));

        String contentProviderAuthorityName = intent.getStringExtra("PACKAGE_NAME");
        ParcelFileDescriptor file = null;
        try {
            file = context.getContentResolver().openFileDescriptor(Uri.parse("content://" + contentProviderAuthorityName + "/webapp"), "r");
        } catch (FileNotFoundException e) {
            Logger.e(e.getMessage());
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        }

        Logger.i("got file - size: " + file.getStatSize());
    }
}
