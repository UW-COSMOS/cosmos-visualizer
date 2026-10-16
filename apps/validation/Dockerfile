# For now, this dockerfile needs to be run against the root of the
# COSMOS-visualizer repository

FROM node:24-alpine AS base
# A simple docker image to install the xDD application

WORKDIR /user
COPY package.json package-lock.json /user/
COPY frontend-shared/package.json /user/frontend-shared/
COPY apps/tagger-demo/package.json /user/apps/tagger-demo/
COPY apps/tagger-xdd/package.json /user/apps/tagger-xdd/
COPY apps/validation/package.json /user/apps/validation/
COPY apps/visualizer-xdd/package.json /user/apps/visualizer-xdd/

RUN npm ci

ARG MODE="development"
ARG PUBLIC_URL="/"
ARG XDD_BASE_URL="https://cosmos1.chtc.wisc.edu:5010/"

COPY . /user

RUN npm run build -w apps/validation

FROM nginx

COPY ./docker-cfg/nginx.frontend-only.conf /etc/nginx/nginx.conf
COPY --from=base /user/apps/validation/dist /frontend
