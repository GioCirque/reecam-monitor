FROM node:lts-alpine

RUN apk --no-cache add ffmpeg --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community
RUN mkdir -p /reecam/server && mkdir -p /reecam/app/build && mkdir -p /reecam/.ipcams
ADD ./build /reecam

VOLUME [ "/reecam/.ipcams" ]

EXPOSE 8080
WORKDIR /reecam/server
CMD [ "node", "serve.js", "8080" ]
