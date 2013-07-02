package org.mozilla.android.synthapk;

/**
 *
 * Description:
 *   Simple logger that displays: class name, method name and line number
 *
 *
 * Usage:
 *
 *   Use this class directly or customize it by extending it.
 *
 *      Logger.i("");
 *      Logger.i("called");
 *      Logger.i("called","tag");
 *
 *      L.i();
 *      L.i("called");
 *      L.i("called","tag");
 *
 * Sub-classing example:
 *
 *    // C.DEBUG = boolean true/false (project specific constant class)
 *
 *    public class L extends HLLog {
 *
 *           public static String DEFAULT_TAG = "MH";
 *
 *           public static void i() {
 *                if(C.DEBUG) callLogger("i", DEFAULT_TAG, "");
 *           }
 *
 *           public static void i(String message) {
 *                  if(C.DEBUG) callLogger("i", DEFAULT_TAG, message);
 *           }
 *
 *           public static void i(String message, String tag) {
 *                  if(C.DEBUG) callLogger("i", tag, message);
 *           }
 *
 *    }
 *
 */

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

@SuppressWarnings("unused")
public abstract class Logger {

    public static String DEFAULT_TAG = C.TAG;

    final static int depth = 4;

    public static void i(String message) {
        callLogger("i", DEFAULT_TAG, message);
    }

    public static void i(String message, String tag) {
        callLogger("i", tag, message);
    }

    public static void d(String message) {
        callLogger("d", DEFAULT_TAG, message);
    }

    public static void d(String message, String tag) {
        callLogger("d", tag, message);
    }

    public static void e(String message) {
        callLogger("e", DEFAULT_TAG, message);
    }

    public static void e(String message, String tag) {
        callLogger("e", tag, message);
    }

    public static void w(String message) {
        callLogger("w", DEFAULT_TAG, message);
    }

    public static void w(String message, String tag) {
        callLogger("w", tag, message);
    }

    public static void v(String message) {
        callLogger("v", DEFAULT_TAG, message);
    }

    public static void v(String message, String tag) {
        callLogger("v", tag, message);
    }

    @SuppressWarnings("rawtypes")
    public static void callLogger(String methodName, String tag, String message) {
        final StackTraceElement[] ste = Thread.currentThread().getStackTrace();
        try {
            Class cls = Class.forName("android.util.Log");
            Method method = cls.getMethod(methodName, String.class, String.class);
            method.invoke(null, tag, getTrace(ste) + message);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        }
    }

    public static String getTrace(StackTraceElement[] ste) {
        return "[" + getClassName(ste) + "][" + getMethodName(ste) + "][" + getLineNumber(ste) + "] ";
    }

    public static String getClassPackage(StackTraceElement[] ste) {
        return ste[depth].getClassName();
    }

    public static String getClassName(StackTraceElement[] ste) {
        String[] temp = ste[depth].getClassName().split("\\.");
        return temp[temp.length - 1];
    }

    public static String getMethodName(StackTraceElement[] ste) {
        return ste[depth].getMethodName();
    }

    public static int getLineNumber(StackTraceElement[] ste) {
        return ste[depth].getLineNumber();
    }

}