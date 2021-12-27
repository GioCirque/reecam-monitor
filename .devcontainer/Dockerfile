# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.209.5/containers/alpine/.devcontainer/base.Dockerfile

# [Choice] Alpine version: 3.14, 3.13, 3.12, 3.11
ARG VARIANT="3.15"
FROM mcr.microsoft.com/vscode/devcontainers/base:0-alpine-${VARIANT}

# Exit immediately if a command exits with a non-zero status
RUN set -ex

# Install base dependencies
RUN apk upgrade --no-cache \
    && apk add --no-cache bash curl git jq openssh openssl sudo unzip nodejs \
    npm yarn ffmpeg docker docker-cli python3 pkgconf make g++ pixman-dev cairo-dev \
    pango-dev libjpeg-turbo-dev

# Install buildx for docker
RUN sudo mkdir -p /docker/cli-plugins \
    && sudo curl -s https://api.github.com/repos/docker/buildx/releases/latest | jq '.assets[]|select(.name|endswith("linux-amd64"))|.browser_download_url' | xargs -n 1 curl -L -s -o /docker/cli-plugins/docker-buildx \
    && sudo chmod a+x /docker/cli-plugins/docker-buildx && docker buildx install

ENV PATH="/docker/cli-plugins:$PATH"
