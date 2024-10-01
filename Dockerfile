FROM node:lts-slim

WORKDIR /home/spese-ql

COPY . .

RUN apt-get update -y && apt-get install -y openssl
RUN npm install