package com.myorg.sample.packaged.webapp;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import android.net.Uri;

/**
 * Created with IntelliJ IDEA.
 * User: martyn
 * Date: 02/07/13
 * Time: 14:45
 * To change this template use File | Settings | File Templates.
 */
public class MainActivity extends Activity {
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent i = new Intent("org.mozilla.REGISTER_PACKAGED_APP");
        i.putExtra("PACKAGE_NAME", this.getPackageName());
        sendBroadcast(i);
    }
}