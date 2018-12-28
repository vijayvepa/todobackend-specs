FROM ubuntu:trusty
MAINTAINER Justin Menga <justin.menga@gmail.com>

# Prevent dpkg errors
ENV TERM=xterm-256color

# Set mirrors to US
RUN sed -i "s/http\/\/archive./http:\/\/us.archive./g" /etc/apt/sources.list

# Install node.js
RUN apt-get update && \
	apt-get install curl -y && \
	curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - && \
	apt-get install -y nodejs

COPY . /app

WORKDIR /app

# Install application dependencies

RUN npm install -g mocha && \
	npm install 

ENTRYPOINT ["mocha"]
