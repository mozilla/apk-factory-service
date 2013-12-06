# Synthesizing APKs is:
The current process of synthesizing APKs is:

* put the icons in the right res/ folders.
* put the title & translations into small XML folders in the correct res/ folder.
* generate an AndroidManifest.xml file with strings taken from the manifest, and some strings we generate (package name, version code, manifest url, permissions, etc).
* get or generate a key, and put it in the right place.
* run the build.

By design, all the Java code is contained in a library project, that is linked to by the AndroidManifest.xml file.

There is could be considerable scope for improving this.

Looking at [A Detailed Look At The Build Process](https://developer.android.com/tools/building/index.html#detailed-build), we can eliminate the Java Compiler step, and start the build at the apkbuilder step (aapt does generate an R.java source file but I'm not sure that we absolutely need it).

If we could pre-generate the dex files, the per APK build process would be aapt, apkbuilder, jarsigner and zipalign.

On my machine, I file'd the tools I could find:

    android-sdk-macosx/build-tools/19.0.0/aapt: Mach-O executable i386
    /System/Library/Frameworks/JavaVM.framework/Versions/Current/Commands/jarsigner: Mach-O universal binary with 2 architectures
    android-sdk-macosx/tools/zipalign: Mach-O executable i386


The apkbuilder is MIA at this point (at least some of that document was [out of date in 2010](https://groups.google.com/forum/#%21topic/android-developers/sls2uFYWuWE)). Fortunately for us, Fennec has trodden this ground before: if you can read .mk files, [here is how they roll](https://mxr.mozilla.org/mozilla-central/source/js/src/config/makefiles/java-build.mk#60).

I don't know enough about it to say if we can:

    distribute just enough tools to do the job (there're also licensing things to worry about).
    do without invoking a JVM at all.
    distribute a CLI without a Java requirement at all.

The full android build would be needed to generate the initial .dex files, which would be needed every time the library project changes.

I can't decipher the Fennec build enough to be able to work out how we would use it, so I'm inclined to over-estimate how long that would take. I'm also not in a position to gauge if this is a necessary optimization step either.

Other sources of investigation may include looking at or using other android build tools. e.g. [Buck](http://facebook.github.io/buck/) and [Gradle](http://tools.android.com/tech-docs/new-build-system/user-guide). A cursory glance at either of these suggests that either could solve a perf problem.