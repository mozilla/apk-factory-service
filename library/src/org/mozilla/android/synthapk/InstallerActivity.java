package org.mozilla.android.synthapk;

import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Process;
import android.preference.PreferenceManager;
import android.util.Log;

public class InstallerActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(C.TAG, "Process pid=" + Process.myPid() + " (installer)");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_installer);

        boolean success = installWebApp() || installRuntime();
        assert success;
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
            startActivityForResult(intent, R.id.install_webapp_into_fennec);
            return true;
        }
        return false;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
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
                .putString("fennecPackageName", data.getStringExtra("fennecPackageName"))
                .putString("slotClassName", data.getStringExtra("slotClassName"))
                .commit();
            nextStep = startWebApp();
        }
        assert nextStep;
    }

    private boolean startWebApp() {
        Intent intent = new Intent(getApplicationContext(), LauncherActivity.class);
        startActivity(intent);
        finish();
        return true;
    }

    private int isCallable(Intent intent) {
        List<ResolveInfo> list = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        return list.size();
    }

}
