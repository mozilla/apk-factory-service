package org.mozilla.fennec.dummy;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.text.TextUtils;

import java.io.*;

public class PackagedAppRunReceiver extends BroadcastReceiver {
    public void onReceive(Context context, Intent intent) {
        String packageName = intent.getStringExtra("PACKAGE_NAME");

        if (TextUtils.isEmpty(packageName)) {
            Logger.i("No PACKAGE_NAME defined in intent");
            return;
        }

        ApplicationInfo app = null;
        try {
            app = context.getPackageManager().getApplicationInfo(packageName, PackageManager.GET_META_DATA);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }

        Bundle metadata = app.metaData;
        if (metadata != null) {
            String type = metadata.getString("webapp");
            if ("packaged".equals(type)) {
                // NO-OP
            } else {
                throw new RuntimeException("Must be a packaged app to install");
            }
        } else {
            throw new RuntimeException("'webapp' metadata needs to be defined in AndroidManifest.xml");
        }

        Logger.i("invoke packaged app run receiver : " + packageName);


        String contentProviderAuthorityName = packageName;
        ParcelFileDescriptor manifestFile = null;
        try {
            manifestFile = context.getContentResolver().openFileDescriptor(Uri.parse("content://" + contentProviderAuthorityName + "/manifest"), "r");
        } catch (FileNotFoundException e) {
            Logger.e("FileNotFound exception whilst transferring manifest from " + packageName);
            e.printStackTrace();
        }

        Logger.i("manifest file - size: " + manifestFile.getStatSize());


        ParcelFileDescriptor archiveFile = null;
        try {
            archiveFile = context.getContentResolver().openFileDescriptor(Uri.parse("content://" + contentProviderAuthorityName + "/archive"), "r");
        } catch (FileNotFoundException e) {
            Logger.e("FileNotFound exception whilst transferring archive file from " + packageName);
            e.printStackTrace();
        }

        Logger.i("got file - size: " + archiveFile.getStatSize());

        //GeckoAppShell.sendEventToGecko(GeckoEvent.createBroadcastEvent("WebApps:InstallApkPackagedApp", null));
    }

    private void writeFile(ParcelFileDescriptor descriptor, File toWrite) throws IOException {

        InputStream fileStream = new FileInputStream(descriptor.getFileDescriptor());
        OutputStream newFile = new FileOutputStream(toWrite);

        byte[] buffer = new byte[1024];
        int length;

        while ((length = fileStream.read(buffer)) > 0) {
            newFile.write(buffer, 0, length);
        }

        newFile.flush();
        fileStream.close();
        newFile.close();
    }
}
