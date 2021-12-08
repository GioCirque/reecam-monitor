FROM node:lts-alpine

# Install basic dependencies
RUN apk add --no-cache build-base cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev pkgconfig libsecret-dev g++ make

# Install python/pip
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

# Install yarn
RUN apk --no-cache add yarn ffmpeg --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

# Bring it all inside
WORKDIR /
ADD . /reecam

# Setup for mapped volume data
RUN mkdir -p /reecam/.ipcams

# Install base with yarn
WORKDIR /reecam
RUN yarn install --network-timeout 100000

# Install app with yarn
WORKDIR /reecam/src/app
RUN yarn install --network-timeout 100000
RUN yarn build

# Ditch all the things we don't need for running
RUN apk del build-base cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev pkgconfig libsecret-dev g++ make

VOLUME [ "/reecam/.ipcams" ]

EXPOSE 8080
WORKDIR /reecam
CMD [ "yarn", "serve", "8080" ]
