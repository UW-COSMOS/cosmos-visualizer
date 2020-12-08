# For now, this dockerfile needs to be run against the root of the
# COSMOS-visualizer repository

FROM node:12-alpine AS base
# A simple docker image to install the xDD application

RUN npm install -g npm@7 webpack-cli webpack

ARG MODE="production"
ARG PUBLIC_URL="/"
ARG API_BASE_URL="https://xdddev.chtc.io/tagger/api"

WORKDIR /user
COPY ./package.json /user/
COPY ./frontend-shared/package.json /user/frontend-shared/
COPY ./apps/tagger-xdd/package.json /user/apps/tagger-xdd/

RUN npm install && npm --prefix apps/tagger-xdd install

COPY . /user

WORKDIR /user/apps/tagger-xdd
RUN webpack

FROM nginx

COPY ./docker-cfg/nginx.frontend-only.conf /etc/nginx/nginx.conf
COPY --from=base /user/apps/tagger-xdd/dist /frontend
