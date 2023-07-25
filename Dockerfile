# FROM debian:stable as base
#
# RUN apt-get update && apt-get install -y --no-install-recommends \
# 		build-essential \
#     nodejs \
#     npm \
#     dbus \
#     curl
FROM alpine

RUN apk add --update --no-cache \
		build-base \
		nodejs \
		npm \
		dbus-dev \
		curl

# Install rust
WORKDIR /tmp
RUN curl https://sh.rustup.rs -sSf > rustup.sh && \
    chmod 755 rustup.sh && \
    ./rustup.sh -y && \
    rm /tmp/rustup.sh && \
    . "$HOME/.cargo/env" && \
    rustc --version && \
    cargo --version

WORKDIR /usr/src/app

COPY package*.json ./
COPY Cargo.toml Cargo.lock tsconfig.json ./
COPY src ./src

RUN . "$HOME/.cargo/env" && \
		npm install

COPY lib ./lib
COPY typings ./typings
COPY tests ./tests
COPY tests/tools/wait-for-it.sh /wait-for-it.sh


CMD npm run test:integration
