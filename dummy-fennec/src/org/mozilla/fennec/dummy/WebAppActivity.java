package org.mozilla.fennec.dummy;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.widget.TextView;

public class WebAppActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_web_app);

        TextView textView = (TextView) findViewById(R.id.manifest_url);



        Intent intent = getIntent();
        String manifestUrl = intent.getStringExtra("manifestUrl");
        boolean isPackage = intent.getBooleanExtra("isPackage", false);

        Log.i(C.TAG, "Installing manifestUrl: " + manifestUrl);

        textView.setText(manifestUrl);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.web_app, menu);
        return true;
    }

}
