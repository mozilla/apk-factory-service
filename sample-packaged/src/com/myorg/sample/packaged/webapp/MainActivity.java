package com.myorg.sample.packaged.webapp;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

public class MainActivity extends Activity {
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent i = new Intent("org.mozilla.REGISTER_PACKAGED_APP");
        i.putExtra("PACKAGE_NAME", this.getPackageName());
        sendBroadcast(i);
    }
}