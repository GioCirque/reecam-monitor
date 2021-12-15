FROM node:lts-alpine

ENV PUBLIC_URL="/app"
ENV PUBLIC_HOST="http://localhost:3000,http://localhost:8080,http://localhost:5555"
ENV REECAM_END_CAP_SEC="30"
ENV REECAM_RELAPSE_MIN="10"
ENV REECAM_CONFIG_PATH="/reecam/.ipcams"

RUN apk upgrade --no-cache && \
    apk --no-cache add pixman cairo pango libjpeg-turbo && \
    apk --no-cache add ffmpeg --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community
RUN npm install -g express --production
RUN mkdir -p /reecam/server && mkdir -p /reecam/app/build && mkdir -p /reecam/.ipcams
ADD ./build /reecam

VOLUME [ "/reecam/.ipcams" ]

EXPOSE 8080
WORKDIR /reecam/server

# Additional options include:
# -p, --port <number>   // Specify port number
# -M --no-monitoring    // Disable monitoring
CMD [ "node", "index.js"]
