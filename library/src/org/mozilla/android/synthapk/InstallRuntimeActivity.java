package org.mozilla.android.synthapk;

import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Process;
import android.util.Log;

public class InstallRuntimeActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(C.TAG, "Process pid=" + Process.myPid() + " (installer)");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_installer);

        boolean success = installRuntime();
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
        Intent intent = new Intent(getApplicationContext(), LauncherActivity.class);

        if (isCallable(intent) > 0) {
            Logger.i("Installing webapp " + getPackageName());
            startActivity(intent);
            return true;
        }
        return false;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        boolean nextStep = false;
        if (requestCode == R.id.install_runtime_from_market && resultCode == Activity.RESULT_OK) {
            nextStep = installWebApp();
        }
        assert nextStep;
    }

    private int isCallable(Intent intent) {
        List<ResolveInfo> list = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        return list.size();
    }

}
