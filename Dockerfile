FROM alpine:edge

# Install prerequisites
RUN apk --no-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/ add \
    nodejs \
    nodejs-npm \
    chromium \
    firefox

# RUN mkdir /testcafe
# COPY package.json /testcafe
# COPY jest.setup.js /testcafe
# WORKDIR /testcafe

# create non-root user
RUN addgroup -g 1000 -S tester && \
    adduser -u 1000 -S tester -G tester
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