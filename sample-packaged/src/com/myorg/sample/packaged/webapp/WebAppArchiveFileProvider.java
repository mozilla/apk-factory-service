package com.myorg.sample.packaged.webapp;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.content.res.AssetManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.*;

public class WebAppArchiveFileProvider extends ContentProvider {

    // The authority is the symbolic name for the provider class
    public static final String AUTHORITY = "com.myorg.sample.packaged.webapp";
    private static final String CLASS_NAME = "WebAppArchiveFileProvider";
    // UriMatcher used to match against incoming requests
    private UriMatcher uriMatcher;

    @Override
    public boolean onCreate() {
        uriMatcher = new UriMatcher(UriMatcher.NO_MATCH);
        uriMatcher.addURI(AUTHORITY, "*", 1);

        return true;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String s, String[] as1, String s1) {
        throw new RuntimeException("Operation not supported");
    }

    // //////////////////////////////////////////////////////////////
    // Not supported / used / required for this example
    // //////////////////////////////////////////////////////////////

    @Override
    public String getType(Uri uri) {
        return "application/zip";
    }

    @Override
    public Uri insert(Uri uri, ContentValues contentvalues) {
        throw new RuntimeException("Operation not supported");
    }

    @Override
    public int delete(Uri uri, String s, String[] as) {
        throw new RuntimeException("Operation not supported");
    }

    @Override
    public int update(Uri uri, ContentValues contentvalues, String s, String[] as) {
        throw new RuntimeException("Operation not supported");
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {


        Logger.v("Called with uri: '" + uri + "'");

        // Check incoming Uri against the matcher
        switch (uriMatcher.match(uri)) {

            // If it returns 1 - then it matches the Uri defined in onCreate
            case 1:
                // Take this and build the path to the file
                AssetManager assetManager = getContext().getAssets();
                File f = null;

                try {
                    Logger.i(getContext().getCacheDir().getAbsolutePath());
                    f = File.createTempFile("moz", "webapp", getContext().getCacheDir());
                    if(!f.exists()) {
                        f.createNewFile();
                    }

                    Logger.i("New file path:" + f.getAbsolutePath());

                    InputStream inputStream = assetManager.open("webapp.zip");
                    OutputStream out = new FileOutputStream(f);
                    byte buf[] = new byte[1024];
                    int len;
                    while ((len = inputStream.read(buf)) > 0)
                        out.write(buf, 0, len);
                    out.close();
                    inputStream.close();
                } catch (IOException e) {
                    Logger.e(e.getMessage());
                }


                // Create & return a ParcelFileDescriptor pointing to the file
                // Note: I don't care what mode they ask for - they're only getting
                // read only
                ParcelFileDescriptor pfd = ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
                return pfd;

            // Otherwise unrecognised Uri
            default:
                Logger.v("Unsupported uri: '" + uri);
                throw new FileNotFoundException("Unsupported uri: " + uri.toString());
        }
    }
}