FROM ubuntu:18.04

# Install prerequisites
RUN apt-get update \
    && apt-get install -y xvfb chromium-browser firefox curl gnupg \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash \
    && apt-get install -y nodejs

# Clean up
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get autoremove -y

# RUN mkdir /testcafe
# COPY package.json /testcafe
# COPY jest.setup.js /testcafe
# WORKDIR /testcafe

# create non-root user
RUN useradd -ms /bin/bash tester
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