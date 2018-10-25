# dockerize all test script to use latest node version

FROM node:alpine

ADD . /app
WORKDIR /app
RUN npm i