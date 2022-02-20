---
title: Auth Token in LocalStorage
date: '2020-03-27'
category: appsec"
preview: images/banner.png
keywords:
  - api
  - auth
  - authentication
  - basic
  - cors
  - csrf
  - endpoint
  - frontend
  - json
  - local
  - storage
  - token
  - xhr
  - xsrf
aliases:
  - appsec/auth-token-in-localstorage
type: post
lastmod: '2022-02-20T13:42:27.320Z'
---

Getting right to the point: storing a token in LocalStorage is insecure.  
It's getting more and more common to use token based authentication, specially on Single Page Applications (SPA) that need to communicate with an API. That is a good thing, and I really like the idea of JWT tokens.

### Why localStorage is bad

Well, when working with cookies, the golden rule is that when storing sensitive information like an auth token, or a session, the cookie should be marked as [httpOnly](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Session_Management_Cheat_Sheet.md#cookies). This means that it cannot be accessed by javascript, preventing this way an attacker from stealing the sessions from other users if they find for example an XSS attack or if a javascript dependency included in the app gets compromised.

So the same way we want cookies to be httpOnly (and nowadays also to have the Secure flag) why would we store a token in localstorage? It has an API to fully control it from javascript, so, no, localStorage is not good enough to store this sensitive data (more about it [here](https://snyk.io/blog/is-localstorage-safe-to-use/)).

SessionStorage has an identical concept, WebSQL and IndexedDB are also accessible through javascript. So where to go?

### Cookies

Yeah, I know... You have an API and stuff and your API's shouldn't use cookies, because it's considered a bad practice.

In fact, cookies are still the best and secure place to save the auth token for a webapp. You can mark it as httponly, which means that javascript code can't access it. And if you need to send it in an XHR request the bowsers also do it for you by default if in the same domain. If you are doing a request to a different domain you need to use the `[withCredentials](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials)` options.

You can also set the cookie as secure, which means that the cookie is being sent only over the HTTPS connections.

But sometimes cookies are not the solution...

### When cookies are not the solution

If you have an application that doesn't have a backend (which is not that common) you can't generate cookies. In this case you have two options:

- **You have a Single Page Application (SPA) and you can keep the token in memory.** This maybe a have some usability problems, like if the user opens a new tab of closes and reopens the page, of even if refreshes it
- **LocalStorage** - This is the bad solution. Unfortunately it has a better user experience. But again an app without a backend is quite uncommon, so my recommendation would just be to create one.

If your login system is in a different domain besides the withCredentials that you need to set in the XHR requests you also need to change the CORS rules to allow the requests from the domain of the frontend.

### Don't forget CSRF

Not using cookies had its advantages and one of them was that you didn't have CSRF attack vectors (unless using BasicAuth). If you get back to cookies you may have this old attack vector back. But not always.

If you have a specific set of conditions you may be safe from CSRF using cookies. Let's take a look at them:

- **Not using GET method to do state changing actions** - This is the most important rule and an important best practice.
- **Have a restrictive CORS policy** **\-** Do not allow requests from URL's others then the one from your frontend
- **Accept only JSON and XML content** - An attacker has two ways to 'trick' a victim into doing a request. Using an html form tag, or a XHR request. The XHR request is already covered because of the CORS policy. The form tag can only send [text, url encoded or form encoded content](https://www.w3schools.com/tags/att_form_enctype.asp).

But have in mind that most of frameworks accepts text/plain content type and then convert it to the expected one, so always make sure plain content type is not enabled.

if you meet these 3 conditions you don't need to worry with CSRF again, Otherwise don't forget to add the the protection.

To wrap up: do not store [auth token in localstorage](https://auth0.com/docs/tokens/guides/store-tokens).
