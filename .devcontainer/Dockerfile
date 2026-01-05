FROM alpine:latest

RUN apk update
RUN apk add exiftool entr git nodejs npm
RUN apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community hugo
RUN npm install -g markdownlint-cli

ENTRYPOINT ["tail", "-f", "/dev/null"]

