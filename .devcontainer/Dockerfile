# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.209.5/containers/alpine/.devcontainer/base.Dockerfile

# [Choice] Alpine version: 3.14, 3.13, 3.12, 3.11
ARG VARIANT="3.15"
FROM mcr.microsoft.com/vscode/devcontainers/base:0-alpine-${VARIANT}

# Exit immediately if a command exits with a non-zero status
RUN set -ex

# Install base dependencies
RUN apk update && apk upgrade --no-cache --available --latest --prune \
    && apk add --no-cache bash curl git jq openssh openssl-dev gcc unzip nodejs \
    npm yarn ffmpeg docker docker-cli docker-cli-buildx python3-dev py3-pip pkgconf \
    make g++ pixman-dev cairo-dev pango-dev libjpeg-turbo-dev libffi-dev libc-dev \
    libressl-dev musl-dev \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | -y | sh \
    && pip install --upgrade pip \
    && sudo pip install docker-compose \
    && docker buildx install

ENV DOCKER_BUILDKIT=1
ENV PATH="$HOME/.docker/cli-plugins:$PATH"
