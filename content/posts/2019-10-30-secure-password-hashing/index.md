---
title: Secure Password Hashing
description: Avoid weak password hashing algorithms like md5 and sha1. Instead chose better solutions like bcrypt, PBKDF2, Argon2 and others
date: '2019-10-30'
category: appsec
preview: images/banner.jpeg
keywords:
  - argon2
  - hash
  - hashing
  - hmac
  - iterations
  - password
  - pbkdf
  - rfc8018
  - salt
  - sha
  - sha1
  - sha256
  - sha512
aliases:
  - appsec/secure-password-hashing
type: post
lastmod: '2022-02-20T13:42:27.329Z'
---

**Password Hashing 101**: MD5 and SHA1 which are quite common, are already considered unsafe. So if you are using them, replace them with a secure algorithm. Even for checksums should not considered secure. Check references for more info.

Now that we put that aside lets start from the basics.

User passwords should always be stored in a one way hash.  
This means that after hashing it the original content cannot be retrieved.

To attack it there are the so called brute force attacks that can try all possible combinations until it gives the same hash. This is usually avoided since it may be quite slow.  
A better way to attack this is to use [Rainbow Tables](https://en.wikipedia.org/wiki/Rainbow_table).  
A Rainbow Table is a pre-computed table that stores the hash values for a specific range and length of characters. This way instead of being hashing all possible combinations, you just need to find the already hashed value, and see the value that generated that hash. This is a lot faster and reliable, if you already have the rainbow table.

And to prevent this type of attacks a salt is used.

## Salt

If you search for salt in cryptography on google you will see everywhere saying that salt adds entropy to the password/hash. But what does that mean?  
It means that adding a salt (which is a set of bytes) to a password its hash will be different. If you want to use the regular pre-computed rainbow tables you won't be able to find the password to login on a system for two reasons:

- You "cannot" find a collision (a collision is when two different inputs give the same hash). If a collision is found in an hashing algorithm it gets considered unsafe. So while you use a considered safe algorithm that shouldn't apply
- Even if you eventually find a collision and set the obtained password on a website to try to login, the webserver will apply a salt to that password and the ending hash will be different.

So you can generate a rainbow table for a specific salt and use it to break a dump of passwords. Well... Salts need be unique, in other words, you should have a different salt for each user. This would make unreliable generating RainbowTables for multiple users.  
If you are generating a new salt for each user you need to save it anywhere. Usually salts are stored in plaintext in the database, thats ok.

Regarding salt there are some discussions about its properties. I'm going to write about my opinions and explain why :)

- **Salt needs to be unique** - This is the most important. Each user password should have an uniquely generated salt for it. Using same salt for multiple users would decrease the effort to crack them.
- **Salt can be public** - Yes, it doesn't matter if an attacker knows your salt... He can't do much with it. He can generate a rainbow table before he gets the hash dump. But, can only try to crack the hash if has access to the DB to get the hash, and if he gets to the DB to get the hash it also gets the salt. Its just a matter of starting a rainbow table sooner. But there is no reason for a salt to be public anyway.
- **Salt doesn't need to be securely generated** - If you look in the web, you will see a lot of articles stating that salt needs to be securely generated. I disagree, first because of the previous point, it can be public. If you just use Random which is predictable, an attacker can guest the next salt values and if it has enough samples (which means had to see previous salts in database) it could predict the next ones. So to correctly predict them it would need to know how much times the Random method had run before. Lets assume that random is only used to generate salts, the attacker would need to know how many users where created since then (could be possible through user ID's) and if salt has changed (when a user changes password), to guess next salts. That's a lot of pre-conditions to be feasible.  
    If you want to use [SecureRandom](https://thesecurityvault.com/weak-random/) there's no harm in doing it. If you have a system with high performance requirements, [Random](https://thesecurityvault.com/weak-random/) is enough to have good security as well
- **Salt should be long enough** - The recommended length is at least 128 bits.
- **When user changes password a new salt should also be generated.**

## Pepper

Pepper is another layer of security and it acts quite like the salt. The difference is that it's the same for all users, and shouldn't be stored on database. Hardcoding it or putting on a config file its ok.

The motivation to do so is that if an attacker gets to dump the database (with an sql injection for example) it still needs the pepper to be able to brute force the credentials.

## Hash Algorithms

Ok, so we already understand salts, what about the right algorithm for hashing?

You cannot tell the "best" one. There are different scenarios, ones better than others.

Lets take a quick look...  
I like to separate the sha* algorithms and... the others :)

For some time sha256 and sha512 have been suggested instead of for example sha1 or md5. The issue with sha256 and 512 is that they are really fast to process. A [challenge on twitter](https://twitter.com/TychoTithonus/status/1314424307208970240) showed that a 10 char sha256 hash was broken by individuals in 5 days

That's why I usually turn to other solutions like Argon2, Bcrypt or PBKDF2

These algorithms take more resources from the machine and are slower to compute. While this can be a disadvantage since it consumes more server resources, they increase significantly the password security.  
IETF published in 2017 [RFC8018](https://tools.ietf.org/html/rfc8018) where PBKDF2 it the recommended algorithm for password derivation (which can be used for password hashing). On the other hand, OWASP [recomends](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Password_Storage_Cheat_Sheet.md#leverage-an-adaptive-one-way-function) the usage of Argon2, Bcrypt is also a good alternative.

There's an awesome article from 1password about how they use [**PBKDF2**](https://support.1password.com/pbkdf2/)

Actually Argon2 is growing on me and it won the [**password hashing competition**](https://password-hashing.net/)

Just out of curiosity I've seen projects where HMAC was used for password hashing but I don't recommend it

## Iterations

Some hash algorithms allow you the define the iterations count. This defines how many times the algorithm is going to be used. It increases the security of your application by making harder to compute the final hash.  
The amount of recommended iterations can change according to each algorithm. For example, NIST recommends 10 000 iterations for [PBKDF2](https://pages.nist.gov/800-63-3/sp800-63b.html#sec5).  
Argon2 not only uses the iterations to affect the computational cost, but you can define the memory to be used and the number of threads. So each system should define this values according to its hardware requirements, and this has impact in the final hash .
