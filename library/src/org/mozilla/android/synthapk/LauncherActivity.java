package org.mozilla.android.synthapk;

import java.util.List;

import android.app.Activity;
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

        boolean success = startWebApp() || installWebApp() || installRuntime();

        assert success;
    }

    public boolean startWebApp() {
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());

        String appUri = prefs.getString(C.APP_URI, null);
        String action = prefs.getString(C.APP_ACTION, null);

        if (appUri != null) {
            Logger.i("appUri = " + appUri);
            Logger.i("action = " + action);


            Intent intent = new Intent();
            intent.setAction(action);
            intent.setDataAndType(Uri.parse(appUri), C.APP_MIME_TYPE);


            if (isCallable(intent) > 0) {
                Logger.i("Running webapp " + appUri);
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

    public boolean installRuntime() {
        Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=pname:"+ C.FENNEC_PACKAGE_NAME));
        // TODO add a dialog

        if (isCallable(marketIntent) > 0) {
            Logger.i("Installing runtime");
            startActivityForResult(marketIntent, R.id.install_runtime_from_market);
            return true;
        }
        return false;
    }

    private boolean installWebApp() {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addCategory(Intent.CATEGORY_DEFAULT);

        intent.setType(C.WEBAPP_MIMETYPE);

        intent.putExtra(C.EXTRA_PACKAGE_NAME, getPackageName());

        if (isCallable(intent) > 0) {
            Logger.i("Installing webapp " + getPackageName());
            startActivityForResult(Intent.createChooser(intent, "Select runtime"), R.id.install_webapp_into_fennec);
            return true;
        }
        return false;
    }

    private int isCallable(Intent intent) {
        List<ResolveInfo> list = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        return list.size();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Logger.i("Back in Synthetic APK requestCode = " + requestCode);
        boolean nextStep = false;
        if (requestCode == R.id.install_runtime_from_market && resultCode == Activity.RESULT_OK) {
            nextStep = startWebApp() || installWebApp();
        } else if (requestCode == R.id.install_webapp_into_fennec && resultCode == Activity.RESULT_OK) {
            String appUri = data.getStringExtra(C.APP_URI);
            String action = data.getStringExtra(C.APP_ACTION);
            PreferenceManager.getDefaultSharedPreferences(getApplicationContext())
                .edit()
                .putString(C.APP_URI, appUri)
                .putString(C.APP_ACTION, action)
                .commit();
            Logger.i("appUri = " + appUri);
            nextStep = startWebApp();
        }
        assert nextStep;
    }

}
