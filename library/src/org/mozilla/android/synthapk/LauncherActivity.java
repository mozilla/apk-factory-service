package org.mozilla.android.synthapk;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;

public class LauncherActivity extends Activity {


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        ensureFirefoxIsAvailable();
    }


    private void ensureFirefoxIsAvailable() {
        Intent intent = new Intent(Intent.ACTION_VIEW);

        intent.setData(getIntent().getData());

        intent.setType(C.WEBAPP_MIMETYPE);
        intent.addCategory(Intent.CATEGORY_DEFAULT);



        int numFirefoxes = isCallable(intent);
        if (numFirefoxes == 0) {
            Logger.i("No runtimes available, launching play store");
            Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=pname:"+ C.FENNEC_PACKAGE_NAME));
            // TODO add a dialog

            startActivityForResult(marketIntent, R.id.install_runtime_from_market);
        } else {
            startWebApp(intent);
        }
    }

    public void startWebApp(Intent intent) {
        Logger.i("At least one runtime available");


        Logger.i("Package name: " + this.getPackageName());
        intent.putExtra("manifestUrl", getPackageName());
        intent.putExtra(C.EXTRA_PACKAGE_NAME, getPackageName());

        try {
            String[] files = getAssets().list("");
            Logger.i("Files available: " + Arrays.toString(files));
        } catch (IOException e) {
            e.printStackTrace();
        }


        startActivity(Intent.createChooser(intent, "Select runtime"));
    }

    private int isCallable(Intent intent) {
        List<ResolveInfo> list = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        return list.size();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        // TODO Auto-generated method stub
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == R.id.install_runtime_from_market && resultCode == Activity.RESULT_OK) {
            ensureFirefoxIsAvailable();
        }
    }

}
