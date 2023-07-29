# This dockerfile is not for production images, it has
# objectives
# - provide an example of install requirements
# - test the build of the project in a musl containerized environment
# - provide an install to run integration tests
FROM alpine

RUN apk add --update --no-cache \
		build-base \
		nodejs \
		npm \
		dbus \
		rust cargo \
		curl

WORKDIR /usr/src/app

COPY package*.json ./
COPY Cargo.toml Cargo.lock tsconfig.json ./
COPY src ./src

# Install dependencies and build
# bindings
RUN npm install

COPY lib ./lib
COPY typings ./typings
COPY tests ./tests
COPY ./wait-for-it.sh /

CMD npm run test:integration
