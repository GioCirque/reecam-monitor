###############################################################################
##                                 BUILDER IMAGE                             ##
###############################################################################
FROM amd64/node:lts-alpine as builder
ENV PUBLIC_URL="/app"
ENV PUBLIC_HOST="http://localhost:3000,http://localhost:8080,http://localhost:5555"
ENV REECAM_END_CAP_SEC="30"
ENV REECAM_RELAPSE_MIN="10"
ENV REECAM_CONFIG_PATH="/reecam/.ipcams"
# Install base dependencies
RUN apk update && apk upgrade --no-cache --available --latest --prune
RUN apk add --no-cache bash curl git jq openssh openssl-dev gcc unzip \
    yarn ffmpeg docker docker-cli docker-cli-buildx python3-dev py3-pip pkgconf \
    make g++ pixman-dev cairo-dev pango-dev libjpeg-turbo-dev libffi-dev libc-dev \
    libressl-dev musl-dev
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | -y | sh
RUN pip install --upgrade pip
COPY . /code
WORKDIR /code
RUN npm install -g canvas --unsafe-perm=true --allow-root
RUN yarn reset
RUN yarn build

###############################################################################
##                             DISTRIBUTION IMAGE                            ##
###############################################################################
FROM node:lts-alpine as distro
ENV PUBLIC_URL="/app"
ENV PUBLIC_HOST="http://localhost:3000,http://localhost:8080,http://localhost:5555"
ENV REECAM_END_CAP_SEC="30"
ENV REECAM_RELAPSE_MIN="10"
ENV REECAM_CONFIG_PATH="/reecam/.ipcams"
RUN apk update && apk upgrade --no-cache --available --latest --prune
RUN apk --no-cache add pixman cairo pango libjpeg-turbo ffmpeg
RUN mkdir -p /reecam/server && mkdir -p /reecam/app/build && mkdir -p /reecam/.ipcams
COPY --from=builder /code/build /reecam
VOLUME [ "/reecam/.ipcams" ]
EXPOSE 8080
WORKDIR /reecam/server

# Additional options include:
# -p, --port <number>   // Specify port number
# -M --no-monitoring    // Disable monitoring
CMD [ "node", "index.js"]
