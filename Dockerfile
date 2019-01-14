FROM alpine:latest

# Install prerequisites
RUN apk --no-cache add nodejs nodejs-npm chromium firefox

# create non-root user
RUN addgroup -g 1000 -S tester \
    && adduser -u 1000 -S tester -G tester
USER tester
WORKDIR /home/tester
COPY package.json /home/tester
COPY jest.setup.js /home/tester

# Install test packages
RUN npm install \
    && npm cache clean --force \
    && rm -rf /tmp/*

# Set path
ENV NODE_PATH=/testcafe/node_modules
ENV PATH=$PATH:/testcafe/node_modules/.bin

# USER root
# COPY docker-entrypoint.sh /
# RUN chmod +x /docker-entrypoint.sh

# Set volume
VOLUME [ "/dockertests" ]