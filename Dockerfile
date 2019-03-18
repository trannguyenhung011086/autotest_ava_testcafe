FROM alpine:edge

# install prerequisites
RUN apk update && apk add \
    nodejs-current \
    yarn \
    chromium \
    firefox

# create non-root user
RUN addgroup -g 1000 -S tester && \
    adduser -u 1000 -S tester -G tester
USER tester
WORKDIR /home/tester

# copy required files
COPY package.json /home/tester
# COPY . /home/tester

# install packages
RUN yarn install \
    && yarn cache clean \
    && rm -rf /tmp/*

# # set path
# ENV NODE_PATH=/autotest/node_modules
# ENV PATH=$PATH:/autotest/node_modules/.bin

# USER root
# COPY docker-entrypoint.sh /
# RUN chmod +x /docker-entrypoint.sh

# set volume
VOLUME [ "/dockertests" ]