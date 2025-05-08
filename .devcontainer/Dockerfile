FROM alpine:latest

RUN apk update
RUN apk add exiftool entr
RUN apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community hugo


ENTRYPOINT ["tail", "-f", "/dev/null"]

