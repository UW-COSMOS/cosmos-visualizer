# For now, this dockerfile needs to be run against the root of the
# COSMOS-visualizer repository

FROM node:12-alpine AS base
# A simple docker image to install the xDD application

RUN npm install -g npm@7 webpack-cli webpack

ARG MODE="development"
ARG PUBLIC_URL="/"
ARG XDD_BASE_URL="https://cosmos1.chtc.wisc.edu:5010/"

WORKDIR /user
COPY ./package.json ./lerna.json /user/
COPY ./frontend-shared/package.json /user/frontend-shared/
COPY ./apps/validation/package.json /user/apps/validation/

RUN npm install && npm --prefix apps/validation install

COPY . /user

WORKDIR /user/apps/validation
RUN webpack

FROM nginx

COPY ./docker-cfg/nginx.frontend-only.conf /etc/nginx/nginx.conf
COPY --from=base /user/apps/validation/dist /frontend
