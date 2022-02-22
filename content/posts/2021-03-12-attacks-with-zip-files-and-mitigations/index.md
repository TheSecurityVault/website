---
title: Attacks with Zip Files and Mitigations
description: There are a few known attacks to zip files. In this post I cover two os the most commons attacks (zipslip and zip bomb) how to exploit and fix them
date: '2021-03-12'
category: appsec
preview: images/banner.png
keywords:
  - bomb
  - path
  - ruby
  - rubyzip
  - slip
  - snyk
  - traversal
  - zip
  - zipruby
aliases:
  - appsec/attacks-with-zip-files-and-mitigations
type: post
lastmod: '2022-02-20T13:42:27.319Z'
---

Once again, I bring a topic that I don't see getting enough attention , and a lot of times this ends up being a big security issue in the targeted systems... Attacks with zip files, two different and interesting attacks.

## ZipSlip

Zip Slip is a vulnerability discovered by [Snyk](https://snyk.io/research/zip-slip-vulnerability) and its a really simple concept. It allows to do some kind of [path traversal](https://owasp.org/www-community/attacks/Path_Traversal) when unzipping files. This happens because the zip specification allows to create file names like:

```bash
../../../../../../../../my_file
```

When extracting files, the file name is usually used (commonly with a prefixed path) in a file write method, to give the name to the extracted file... But since the path name contains all those '../' you are in fact setting the file path somewhere else.

### Creating the malicious Zip Files

As far as I know, you can't use regular zipping utilities to create the malicious zip files as none support it. But you can do a bit of code, and easily achieve the final result.

The following code is a simple java function that zips a file called zip_me.txt and stores it in the zip as "../malicious_entry.txt"

```java
public static void zip() throws FileNotFoundException, IOException{
    String sourceFile = "test/archive/zip_me.txt";
    FileOutputStream fos = new FileOutputStream(fileZip);
    ZipOutputStream zipOut = new ZipOutputStream(fos);
    File fileToZip = new File(sourceFile);
    FileInputStream fis = new FileInputStream(fileToZip);
    ZipEntry zipEntry = new ZipEntry("../malicious_entry.txt");
    
    zipOut.putNextEntry(zipEntry);
    byte[] bytes = new byte[1024];
    int length;
    while((length = fis.read(bytes)) >= 0) {
      zipOut.write(bytes, 0, length);
    }
    zipOut.close();
    fis.close();
    fos.close();
}
```

### Impact

Now that we understand how these attacks with zip files work whats the impact that this can have? Well, basically the same as [path traversal](https://owasp.org/www-community/attacks/Path_Traversal)... You can for example write a file in the application root folder that can give you a remove shell to the server. So this can be high severity.

### Prevention

Note that not all libraries/tools will be affected by this attack, for example [The Unarchiver](https://apps.apple.com/us/app/the-unarchiver/id425424353?mt=12) ignores the file, default [ruby zip library](https://github.com/rubyzip/rubyzip) ignores the file path with a warning like: "WARNING: skipped "../" path component(s) in ../malicious_entry.txt"

So the question is: "Shouldn't all libraries prevent this attack?". And the answer is no. As said above, the zip specification allows these filenames, so a library at a low level should also allow. Now, if you are using a high level library to help you zip/unzip files that library needs to prevent this.

[Snyk](https://snyk.io/) also keeps a list of libraries which are affected or not by ZipSlip [here](https://github.com/snyk/zip-slip-vulnerability) but I would say that its better to test it as for example, if a library doesn't provide a high level API its not the library responsibility to "prevent" the attack but some do, like the ruby's [rubyzip](https://github.com/rubyzip/rubyzip)

From the code side, the safest way is to resolve the canonical path of each file before writing it and make sure it is inside the directory you intended it to be:

```java
String canonicalDestinationDirPath = destinationDir.getCanonicalPath();
File destinationfile = new File(destinationDir, e.getName());
String canonicalDestinationFile = destinationfile.getCanonicalPath();
if (!canonicalDestinationFile.startsWith(canonicalDestinationDirPath + File.separator)) {
  throw new ArchiverException("Entry is outside of the target dir: " + e.getName());
}
```

## Zip Bomb

Some other interesting attacks with zip files are zip bombs.

A zip bomb is a zip file that after uncompressed increases significantly its size, this is due to the way zip compression works, by keeping track of repeating patterns, and replacing it by a smaller representation. So what appears to be a small zip file can end up being a huge file.

### Bomb Impact

A zip bomb can be used for example to DoS a system. Imagine that an application does heavy operations in a zip file, lets say it extracts all files and searches for specific strings in it. The file ZIP was limited to 50MB so that it doesn't take to much system resources. The unzipped file can be 5GB, and searching for a string in a 5GB file is significantly slower, and do not forget of the fact that you will probably unzip and store the unzipped file in disk, which also takes some time.

### Creating a zip bomb

Ok, so how to create a zip bomb?

We just need to create a huge file with a repeating pattern:

```ruby
File.open("test.txt","w") do |line|
  (1...99999999).each do |i|
    line.print "000000000000000000000000000000000000000000000000000000000000"
  end
end
```

The code above generates a text file with zeros, that has about **6GB**.

After compressing that generated file you end up with an archived file with around **6MB**. Huge difference right?

This is awesome to bypass upload size limits for example.

### Bomb Prevention

Its quite easy to prevent a zip bomb from exploding... All you need to do is check the file's original size before writing it to disk. Set a limit to the uncompressed file sizes, or a deviation between the compressed and uncompressed sizes.

In the following java example its assumed that the zip file contains source code files, so a validation exists that no file can be bigger then 10MB. **Depending on your requirements this might not be the best solution**.

```java
public static void unzip() throws FileNotFoundException, IOException{
    byte[] buffer = new byte[1024];
    ZipFile zipfile = new ZipFile("zipbomb.zip");
    Enumeration zipEnum = zipfile.entries();
    
    while (zipEnum.hasMoreElements ()) 
    { 
        ZipEntry zipEntry = (ZipEntry) zipEnum.nextElement(); 
    
        File newFile = new File(zipEntry.getName());
        if (zipEntry.isDirectory()) newFile.mkdirs();
        else if(zipEntry.getSize() < (10 * 1024 * 1024)) { //<10MB
            
            FileOutputStream fos = new FileOutputStream(newFile);
            int len;
            InputStream is = zipfile.getInputStream(zipEntry);
            while ((len = is.read(buffer)) > 0)
                fos.write(buffer, 0, len);
            
            fos.close();
        }
        else
            System.out.println("File to big to extract");
    }
    zipfile.close();
    
}
```

### New Zip Bomb attack

The method described above is quite old, and even if 5MB going to 5GB seems quite interesting in 2019 a [much better technique](https://www.bamsoftware.com/talks/woot19-zipbomb/) was found. In the link you can find the presentation about the finding, where its described in detail this new attack.

I will not get into the technical details, but you can use the [tool provided by the researcher](https://www.bamsoftware.com/hacks/zipbomb/#source) to generate a much more "productive" zip file, where a 40kb zipped file can be uncompressed into more then 5GB.

I tested this with a few different tools/libraries and they seem to be patched against it. [The Unarchiver](https://apps.apple.com/us/app/the-unarchiver/id425424353?mt=12) isn't vulnerable to this attack either. But again, nothing better then testing it in your environment.

## Not only for Zip Extensions

These attacks can also be exploited in other file types like .apk, docx, .jar as they are in fact a zipped directory. So be careful with any zip based extension and always make sure the code you're using isn't vulnerable
