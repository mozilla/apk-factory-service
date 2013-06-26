package org.mozilla.fennec.dummy;

import android.app.Activity;
import android.os.Bundle;
import android.view.Menu;

public class WebAppActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_web_app);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.web_app, menu);
        return true;
    }

}
