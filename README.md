# The security Vault website

## Environment Setup

* hugo
* exiftool
* vscode
* markdownlint

You can check `.github/workflows/deploy.yml` on how to configure the environment

Run the followng command to config the git hooks

```bash
git config core.hooksPath .githooks
```

## Running locally

```bash
hugo server -w
```
