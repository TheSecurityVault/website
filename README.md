---
lastmod: '2022-02-20T00:51:37.554Z'
---
# The security Vault website

## Environment Setup

* hugo
* exiftool
* vscode
* markdownlint

You can check `.github/workflows/deploy.yml` on how to configure the environment

Use the following pre commit hook, to format markdown and remove exif from images

```bash
#!/bin/bash
markdownlint --fix .
# Stash unstaged changes
git stash -q --keep-index
exiftool -r -all= -ext jpg -ext gif -ext png .
find . -name "*_original" | xargs rm
# Stage updated files
git add -u
# Re-apply original unstaged changes
git stash pop -q
```

## Running locally

```
hugo server -w
```
