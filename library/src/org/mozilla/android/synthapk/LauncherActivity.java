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
import android.preference.PreferenceManager;

public class LauncherActivity extends Activity {


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        boolean success = startWebApp() || installWebApp();

        assert success;
    }

    private boolean installWebApp() {
        Intent intent = new Intent(getApplicationContext(), InstallerActivity.class);
        startActivity(intent);
        return true;
    }

    public boolean startWebApp() {
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
