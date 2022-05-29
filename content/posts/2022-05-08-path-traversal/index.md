---
title: Path Traversal & LFI can be worst than you think
description: Path Traversal& LFI are old and wellknown vulnerabilities. What most don't know is that they can be leveraged to enumerate the running server, including running processes.
category: appsec
preview: images/banner.png
keywords: 
  - path
  - traversal
  - lfi
  - enumeration
  - local file inclusion
  - vulnerability
  - proc
  - /proc
  - enumeration
  - enumerate
  - secrets
  - dump
  - passwords
  - envionment
  - variables
draft: false
lastmod: '2022-05-29T15:37:27.214Z'
type: post
---

LFI and Path traversal are not a new thing, but what most people don't understand is the full impact of the vulnerability.

In this post I'll cover different attack scenarios when exploiting a LFI vulnerability, like enumerating process, dumping environment variables, and on more extreme cases remote code execution (RCE).

## LFI Recap

This type of attack happens when the application loads a file from the the filesystem and somehow the user can exploit this behavior to load unintended files and eventually retrieve its content.

The following code snippet is a common example of a LFI vulnerability:

```php
<?php
$file = $_GET['file'];
if(isset($file))
  include("pages/$file");
else
  include("index.php");
?>
```

## Enumeration

When you find a LFI you can start retrieving some common files to get some basic information about the system. Here's a short list of the most common ones:

* /etc/passwd
* /etc/crontab
* /proc/mounts
* /etc/issue
* /etc/resolv.conf
* /etc/hostname
* /etc/crontab"
* /etc/group

### The /proc folder

Lets now see some more advanced exploit techniques, starting with the Linux's `/proc` folder. This is where a lot of magic happens in the Linux system.

I will not get too much into the details of `/proc` as it is a bit complex, but I recommend you dig deeper about it. For the moment let's just say that in `/proc`  you can "query" the OS for some resources about the machine/OS and the running processes.

Lets see a simple example:

```txt
$ cat /proc/version
Linux version 5.4.0-1062-azure (buildd@lgw01-amd64-007) (gcc version 7.5.0 (Ubuntu 7.5.0-3ubuntu1~18.04)) #65~18.04.1-Ubuntu SMP Tue Oct 12 11:26:28 UTC 2021
```

We can leverage the virtual files in `/proc` with LFI to enumerate a lot of things of a running server.

Here's a list of some of the most interesting:

* /proc/version - OS Version
* /proc/net/tcp - open TCP ports
* /proc/net/udp - open UDP ports
* /proc/sched_debug - can be used to retrieve running processes
* /proc/mounts - Mounted devices
* /proc/[PID]/cmdline - command line that triggered the running process
* /proc/[PID]/environ - environment variables accessible to the process
* /proc/[PID]/cwd - current working directory of the process
* /proc/[PID]/fd/[n] - files opened by the process
* /proc/[PID]/exe - link to the executable file

If `/proc/sched_debug` is not available we can create a simple script to loop over a set of possible process ID's and you can get the maximum process id by querying `/proc/sys/kernel/pid_max`

If we are trying to enumerate the running process Linux exposes the `self` keyword that can be used instead of a process id:

* /proc/self/cmdline
* /proc/self/environ
* /proc/self/cwd
* /proc/self/fd/[n]
* /proc/self/exe

Have in mind that when using this technique you can only see the same information that the process is running has permissions to.

### Dumping Secrets

[Hardcoded passwords](https://thesecurityvault.com/hardcoded-passwords/) finally have some attention nowadays, unfortunately a common way to fix it is by using environment variables. This is used a lot when dealing with docker containers for example.

Using a LFI with `/proc/[PID]/environ` we can leverage an attacker to dump secrets from running processes, including from the current web application.

The best approach is to use a [secret manager](https://thesecurityvault.com/hardcoded-passwords/#secret-managers) like Hashicorp's [Vault](https://www.hashicorp.com/products/vault) or [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/). This way your secrets are stored safely and when you retrieve them they only need to be kept in memory while the app runs.

**Bonus Tip**: Don't trust your secrets directly to these services, instead, encrypt them before storing them in the secret manager. You can keep the key to decrypt it in the code or env var or config file as this is just an extra security layer, like [peppering](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#peppering) when doing an hash.

<!-- ## Prevention

This is a golden rule for everything and not only for LFI but never trust data coming from the frontend. Always double check everything. If you need to retrieve a file, for example, based on a user operation you can for example have a whitelist of names that can be used. If the input is not exactly one of the values allowed, do not load the file.

But if you need something more dynamic, like to retrieve uploaded files, you can store a mapping of the files in a DB. You retrieve to the user an unpredictable ID like a uuid and when supplied back, you map that id to a path in the filesystem. Notice that the unpredictable here is important otherwise an attacker can find his way to all files.

Also if you are retrieving files to be downloaded, don't forget to verify if the user has permissions to download the file. Never expose just a direct link to the resource like: `example.com/somefile.mp4`. -->
