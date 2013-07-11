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

    public static final int TYPE_MANIFEST = 1;
    public static final int TYPE_ARCHIVE = 2;

    // The authority is the symbolic name for the provider class - can prob be derived from the app package name in the future
    public static final String AUTHORITY = "com.myorg.sample.packaged.webapp";

    private UriMatcher uriMatcher;

    @Override
    public boolean onCreate() {
        uriMatcher = new UriMatcher(UriMatcher.NO_MATCH);
        uriMatcher.addURI(AUTHORITY, "manifest", TYPE_MANIFEST);
        uriMatcher.addURI(AUTHORITY, "archive", TYPE_ARCHIVE);

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
        switch (uriMatcher.match(uri)) {
            case TYPE_MANIFEST:
                return "text/plain";
            case TYPE_ARCHIVE:
                return "application/zip";
            default:
                throw new RuntimeException("Unsupported file type");
        }
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

        switch (uriMatcher.match(uri)) {
            case TYPE_MANIFEST:
                return getFile("mini.manifest");

            case TYPE_ARCHIVE:
                return getFile("webapp.zip");

            // Otherwise unrecognised Uri
            default:
                Logger.v("Unsupported uri: '" + uri);
                throw new FileNotFoundException("Unsupported uri: " + uri.toString());
        }
    }

    private ParcelFileDescriptor getFile(String fileName) throws FileNotFoundException {
        AssetManager assetManager = getContext().getAssets();
        File f = null;

        try {
            f = File.createTempFile("moz", "webapp", getContext().getCacheDir());
            if (!f.exists()) {
                f.createNewFile();
            }

            Logger.i("New file path: " + f.getAbsolutePath());

            InputStream inputStream = assetManager.open(fileName);
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

        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);

    }
}
