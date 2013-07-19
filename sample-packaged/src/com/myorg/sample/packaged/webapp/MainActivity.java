package com.myorg.sample.packaged.webapp;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;

public class MainActivity extends Activity {
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        findViewById(R.id.launch_intent).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent i = new Intent("org.mozilla.REGISTER_PACKAGED_APP");
//              Intent i = new Intent("org.mozilla.fake.REGISTER_PACKAGED_APP");
                i.putExtra("PACKAGE_NAME", getPackageName());
                sendBroadcast(i);
            }
        });
        findViewById(R.id.launch_broken_intent).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent i = new Intent("org.mozilla.REGISTER_PACKAGED_APP");
//              Intent i = new Intent("org.mozilla.fake.REGISTER_PACKAGED_APP");
                i.putExtra("PACKAGE_NAME", getPackageName());
                i.putExtra("AUTHORITY", getPackageName() + ".broken");

                sendBroadcast(i);
            }
        });

    }
}