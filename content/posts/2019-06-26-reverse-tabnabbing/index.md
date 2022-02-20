---
title: Reverse Tabnabbing
date: '2019-06-26'
category: appsec
preview: images/banner.jpeg
keywords:
  - blank
  - noopener
  - noreferrer
  - opener
  - referrer
  - rel
  - reverse
  - tab
  - tabnabbing
  - target
  - unsafe
aliases:
  - appsec/reverse-tabnabbing
type: post
lastmod: '2022-02-20T13:42:27.338Z'
---

Reverse Tabnabbing or also known as Unsafe Target Blank is one of the most underrated vulnerability, and this is the one I like the most. It's really easy to find an exploitable web application and it's also quite easy to mitigate.

## So what is Reverse Tabnabbing?

When you create a link that opens in a new tab (with target='_blank') the browsers injects two variables into the destination page, [window.opener](https://developer.mozilla.org/en-US/docs/Web/API/Window/opener) and [window.referrer](https://developer.mozilla.org/en-US/docs/Web/API/Document/referrer).

window.referrer just stores the website that opened the page.

window.opener has a reference to the page that opened the new one.  
Nowadays browsers prevent the access to most of the properties of this variable, since it posed many security risks, but there are still some properties that you can access/change, being the most important window.opener.location.

Note that you cannot read window.opener.location, but you can change its value. If you need to get the url from where the user came from you can use document.referrer

Lets work with the following code which contains a unsafe target blank implementation:

```html
<!DOCTYPE HTML>
<html>
  <head>
    <title>TheSecurityVault - Reverse Tabnabbing</title>
  </head>
  <body>
    <h1>TheSecurityVault</h1>
    <a href="reverse_tabnabbing_malicious.html" target="_blank">Click me</a>
  </body>
</html>
```

You can find the code and try it [here](/reverse_tabnabbing.html)

Now if a victim opens this link, the 'malicious' page can see where the user came from and even redirect him

This is the malicious code:

```html
<!DOCTYPE HTML>
<html>
  <head>
    <title>Hello World! Site Title</title>
  </head>
  <body>
    <h1>TheSecurityVault!</h1>

    <script>
      console.log(document.referrer); //this doesn't work without a webserver
      window.opener.location = "https://google.com";
    </script>
  </body>
</html>
```

If you test the above example and open the link, you will see that your previous tab gets redirected to google.

## What can an attacker do?

A malicious page can first, get the page where you came from, lets say facebook. Then it redirects your other tab to a facebook phishing page. Just exactly like facebook, but you are not logged in. Maybe you could find it weird, and try to understand what is the problem, why you were logged out, but most of the users would just ignore it, as they [ignore invalid SSL warnings](https://nakedsecurity.sophos.com/2015/02/03/google-redesigns-security-warnings-after-70-of-chrome-users-ignore-them/), and try to log in. At this point an attackers gets the credentials you typed in, and game over.

Another thing that can be done, is for websites to monitor from which page you came from, and build a profile for you, the sites you visit, and consequently your interests. This is awesome for targeted advertising for example.

## How to Protect it

The protection is quite easy. You just need to add to your link the rel attribute like so:

```html
<!DOCTYPE HTML>
<html>
  <head>
    <title>TheSecurityVault - Reverse Tabnabbing</title>
  </head>
  <body>
    <h1>TheSecurityVault</h1>
    <a href="reverse_tabnabbing_malicious.html" target="_blank" rel="noopener noreferrer">Click me</a>
  </body>
</html>
```

This will ensure the new page will not have the window.opener nor window.referrer properties.

You can test the prevention [here](/reverse_tabnabbing_safe.html)

## For javascript

In javascript this is a little bit more tricky. I couldn't clear the referrer so I did some googling... Most of the sites ignore the referrer and the few I found mentioning it, their solutions didn't work either :(

So what I recommend, if you really need to use javascript, generate a new link and add it to the DOM, you can do this by injecting a hidden link with the rel attribute, trigger a click, and finally remove it from the page like so:

```js
var a = document.createElement("a");    
a.style.display = "none";
a.setAttribute("href", "reverse_tabnabbing_malicious.html");
a.setAttribute("rel", "noopener noreferrer");
a.setAttribute("target", "_blank");

document.body.appendChild(a);

a.click();

a.remove()
```
