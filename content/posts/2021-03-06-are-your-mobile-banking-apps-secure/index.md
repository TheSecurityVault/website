---
title: Are your mobile banking apps secure?
date: '2021-03-06'
category: appsec
preview: images/banner.png
keywords:
  - mobile
  - bank
  - banking
  - security
aliases:
  - appsec/are-your-mobile-banking-apps-secure
type: post
lastmod: '2022-02-20T13:42:27.328Z'
---

These past few days I've been doing some security checks in my mobile banking apps as I basically never did it since opening the accounts a lot of years ago. I was quite surprised with the difference of security among my bank applications, and it even motivated me to close one of the accounts.

In this article I'm going to compare some of the security features between two of my banks' mobile applications, from the user perspective, without going into the underlying details of the coding implementation.

I hope to share some light about things you should have (or not), security wise, with your banking apps

To differentiate between between the two apps, I'll refer to them as the "Safer App" and the "Not so Secure App". I will not mention the bank names.

## Initial Login

The Safer App require you to go to an ATM requesting a new login. This option generate a username automatically and require you to define a 7 digit code. The username can only be used to register one device and the 7 digit code is bound to that user only. After that you need to request new login to register other devices. When logging in in the app you need to introduce the generated username and 3 of the 7 digits code. A particularly interesting feature is that all operations that ask you for 3 digits will always ask for the 3 same digits, until you correctly provide them. So if you cancel the operation and try again, will ask the same 3 digits. This is good, in case an attacker finds 3 of those digits and tries to get the app to request those specific 3.

The Not so Secure app after enabling mobile app access with the bank asks you 3 digits from 1 of the two: SSN or personal id number. This is public information so not a good start. In the same way the app requires you 3 digits from a 7 digit defined code. And oposite to the Safer app, if you cancel the operation and open again it will ask you for a new code.

Both apps support to use FaceID with my iPhone although personally I don't recommend enabling this feature, as you can sometimes allow other people to unlock the phone.

## Application Access

Both applications require you to set a 4 digit pin to access the app. The option to go with a 4 digit here is nice because if forces the user to create a different code then the 7 digit code. Unfortunately 4 digit pins are used for a lot of different things, so users will probably reuse them. A better approach would be to force a password, or create a code with different size and check that it doesn't contain a sequence from the 7 digit code.

Obviously for an attacker to use the app still needs access to the phone... And a 4 digit it's better than nothing, but if the attacker knows the person... it can easily enter the bank app. Also 4 digit codes tend to be important years (like birth) or special dates (month/day, day/month). Also none of the applications forced the user to have a passcode to lock the cellphone.

It should be a best practice for apps that deal with sensitive data, to force or at least advise the users to create a lock passcode for their phones in case somebody steals it.

Also, the Safer app, every time its backgrounded requires the 4 digit code to login again. The same doesn't happen with the not so secure app, which I believe that needs to be in background for more than X seconds/minutes before requesting the code again. So if I give my phone to somebody after opening the banking app, that person can easily access my banking app without any verification.

## Operations' Authorization

This is probably the most important part... What do you need to do an operation in the application?

### The Matrix Card

A few years ago there was a common practice of creating a matrix card, which consisted on a big table with tons of codes. Then an app would ask you for a code at for example C5 and the user would use this coordinates to get a code in the matrix card to insert in the app.

Although this seems a good and secure idea, the fact is that the security of your operations are as secure as the card, and this card in most cases was on users' wallets. If that wallet gets stollen an attacker could ask your bank through telephone to do a transfer for example. Also the codes in the matrix card couldn't be changed, so do you trust in everybody involved in the process of sending it to you?

Although this practice is still used, its not that common anymore.

### 7 digits pin code

Banking apps started to use for example a 7 digit code, where it asks 3 digits from it. Obviously guessing 3 digits isn't hard as you only have 1000 possible combinations. So is it worth it?

Well yes, if you have a small number of attemps. Like 3 consecutive failures the app blocks.

This is what happens with the Safer App. And I've been there... By mistake I got my app blocked. And the reaction from the bank was awesome. I got an SMS and email right after it, and a guy from the bank called me in less than 5 minutes notifying me of a possible security breach in my account and that my account's online operations were temporarily locked until verification. I had to confirm it was me, so he could unlock the account. but I still had to go to an ATM and request a new access. Awesome.

Also, if you are doing large transfers or other actions considered high risk (not sure what constitutes that) an SMS with a code is also sent to the phone to confirm and an email notification is sent after the operation. Although an SMS can work nice in the web app when you're at the computer, confirming an action done on the telephone with an SMS to that phone its not that good, but...

The not so secure app, asks for confirmation for every operation but the confirmation is just an SMS. And I don't want to get into the details of SMS security, but if you have a mobile app, and you ask for confirmation only with an SMS, what good is that for if you are going to receive the SMS on the same device?

This SMS verifications can help if an attacker is trying to remotely hack you account, but it doesn't help at all for "local" security.

I never tried to fail this confirmation to see what happens, but I'm somehow convinced that nothing would happen. (Added to my todo list)

## Notifications

Let's start by the not so secure app this time. Because of the issues with the SMS validation described above I tried to enable notifications for basically all operations that were done with the account, so that at least I could track if something bad happened.

No notifications were available at the app (only for bank news)... So, not happy with that I called the bank support and asked if I could get notified of any operation that happens in my account. Thats definitely a question they don't get a lot, I was on hold for an answer for almost 10 minutes. At the end and after saying that it wasn't possible the call finished with something like: "Its definitely a good idea and we will take this into consideration for improving our security".

On the bright side the safer app has notifications for all operations, and you can enable push notifications or receive emails for transfers sent/received, direct debits, logins, etc. Now, every time I use apple pay on my phone I get instantly a notification from my bank's app that a payment was done. Awesome again.

## Privacy

I have to say that this wasn't something I dug to much but there are two things that I want to mention.

First is [screen caching](https://thesecurityvault.com/screen-caching/), that I already covered [here](https://thesecurityvault.com/screen-caching/).

Every time I send the Safer app to the background, all data is hidden by the bank's logo, so it can't be seen in the app switcher. On the other hand, the not so secure app does nothing, so somebody using my phone could see my banking balance without having access to the app.

The second thing regarding privacy I have to admit that I never saw this in any other of my apps (but seems to be common), and although I never had a real case to use it, I love it. This is a feature present in the safer app and its called "Privacy Mode".

Basically at login, I can enable the privacy mode, that will just hide my balance and any transaction value so that it is "safe" to open the app with people around. This is awesome to protect me shoulder surfing.

## Card Security

The safer app allows me to configure if I want my card to be able to be used in online payments, outside my country, to disable contactless or temporarily disable the card. It is still missing a nice feature of disabling ATM withdraws.

On the other side, the not so secure app doesn't offer any of these features.

## Custom Keyboards

For this section I have to admit that I didn't test it in my apps...

But its a good practice for applications that deal with sensitive information to disallow the use of custom keyboards on sensitive fields as they can collect typed data and send it to a server. This happens a lot, specially with keyboards that adapt/learn to know what you are going to type next to give you suggestions.

It is also common to see a custom keyboard, implemented by the app, for the initial 4 digit pin for the same reason, although other inputs are usually forgotten.

So how are you mobile banking apps security? Are they careful with the details? Or is it time to switch banks?
