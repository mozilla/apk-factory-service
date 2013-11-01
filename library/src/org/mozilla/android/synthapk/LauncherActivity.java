package org.mozilla.android.synthapk;

import java.util.List;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Process;
import android.preference.PreferenceManager;
import android.util.Log;

public class LauncherActivity extends Activity {


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(C.TAG, "Process pid=" + Process.myPid());
        Log.i(C.TAG, "Package resource path is " + getPackageResourcePath());
        Log.i(C.TAG, "Package     code path is " + getPackageCodePath());


        super.onCreate(savedInstanceState);
//        setContentView(R.layout.activity_launcher);
        boolean success = startWebApp() || installRuntime();

        assert success;
    }

    public boolean installRuntime() {
        Intent intent = new Intent(getApplicationContext(), InstallRuntimeActivity.class);
        if (isCallable(intent) > 0) {
            startActivity(intent);
            return true;
        }
        return false;
    }

    private boolean startWebApp() {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addCategory(Intent.CATEGORY_DEFAULT);

        intent.setType(C.WEBAPP_MIMETYPE);

        intent.putExtra(C.EXTRA_PACKAGE_NAME, getPackageName());

        String iconUri = "android.resource://" + getPackageName() + "/drawable/ic_launcher";
        Log.i(C.TAG, "Icon uri: " + iconUri);
        intent.putExtra(C.EXTRA_ICON_URI, iconUri);

        Logger.i("Installing and starting webapp " + getPackageName());
        if (isCallable(intent) > 0) {
            startActivity(intent);
            return true;
        }
        return false;
    }

    public boolean startWebApp1() {
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());

        String appUri = prefs.getString(C.APP_URI, null);

        String action = prefs.getString(C.APP_ACTION, null);

        String fennecPackageName = prefs.getString("fennecPackageName", null);

        String slotClass = prefs.getString("slotClassName", null);

        if (appUri != null) {
            Logger.i("appUri = " + appUri);

            Intent intent = new Intent(action);
            intent.setComponent(new ComponentName(fennecPackageName, slotClass));
            intent.setData(Uri.parse(appUri));

            if (isCallable(intent) > 0) {
                Logger.i("Running webapp " + appUri);
                this.startActivity(intent);
                return true;
            } else {
                Logger.i("Can't find webapp slot");
                this.startActivity(intent);
                return true;
            }

            // We once were installed, but we don't seem to be now.
            // Perhaps Firefox is no longer installed?
        }
        return false;
    }

    @Override
    public void onResume() {
        super.onResume();

    }

    private int isCallable(Intent intent) {
        List<ResolveInfo> list = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        return list.size();
    }

}
