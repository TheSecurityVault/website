---
title: Security of Github Actions
date: '2022-02-19T00:15:40.578Z'
category: appsec
preview: images/
tags:
  - null
aliases:
  - appsec/security-of-github-actions
draft: true
lastmod: '2022-02-19T00:44:18.018Z'
type: post
---

Github actions are a thing more and more common, and I have to admin, I love them. But but the security of github actions are usually ignored. In this post I'll go through some of common flows and issues, and see some preventions

## Github actions overview

Github actions are an awesome way of creating CI/CD pipelines on github. Developers can easily create .yaml files to configure actions and perform common like running tests or build processes.

You can use also use javascript (and other languages) to create a more complex action.

Actions are used to deploy code, run tests, run SAST scans, run linters, build products, block the pipelines for approvals, and basically anything that you can remember.

Due to all the possible things actions can do they usually have a lot of actions. Most of the times this is configured with github secret's.

## Possible issues

### Action Injection

There are multiple ways devs can change the action. For example, in an organisation users can edit the actions of any repo they have write access to. The scary thing about it is that if you add/change an action that runs on a push, that action will just run. You don't need a PR to be approved to main/master branch.

On public repos thats also tricky

### Secrets Leak

Although github does some filtering on the actions output to prevent secrets from being leaked, this routine is basically a simple search and replace. So secrets can still be printed to the action log if you base64 encode it for example, or if you reverse the string, or if you print one char at a time (and many other ways). Having this chained with the previous issue (Action injection) and you get a serious thing. Even more serious if you're in an organisation with globally configured secrets (common to all repos).

### Privilege Escalation

Github allows you to run your actions in different Runners. A runner is basically a container where your action instructions will run. A lot of organisations use custom runners inside AWS for example, with privileged accesses to deploy whatever is required for the applications triggering the github action.

### Billing issues

Github actions are not free. For each different plan, github offers an amount of minutes for actions to run. When that time comes to an end minutes are billed. Devs can exploit this to make actions run for big amounts of time and a lot of times, to increase the billing.
