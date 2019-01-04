# dockerize all test script to use latest node version

FROM node:alpine

# RUN apk --no-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/ add \
#     nodejs \
#     nodejs-npm \
#     chromium \
#     firefox \
#     xwininfo \
#     xvfb \
#     dbus \
#     eudev \
#     ttf-freefont \
#     fluxbox

ADD . /app
WORKDIR /app
RUN npm i && npm cache clean --force && rm -rf /tmp/*
