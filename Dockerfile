FROM node:lts-alpine

ENV PUBLIC_URL="/app"
ENV REECAM_CONFIG_PATH="/reecam/.ipcams"
ENV PUBLIC_HOST="http://localhost:3000,http://localhost:8080,http://localhost:5555"

RUN apk --no-cache add ffmpeg --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community
RUN mkdir -p /reecam/server && mkdir -p /reecam/app/build && mkdir -p /reecam/.ipcams
ADD ./build /reecam

VOLUME [ "/reecam/.ipcams" ]

EXPOSE 8080
WORKDIR /reecam/server

# Additional options include:
# -p, --port <number>   // Specify port number
# -M --no-monitoring    // Disable monitoring
CMD [ "node", "index.js"]
