FROM node:12-alpine AS base
# A simple docker image to install the xDD application

RUN npm install -g npm@7 webpack-cli webpack

ARG ENVIRONMENT="production"
ARG PUBLIC_URL="/"
ARG XDD_BASE_URL="https://xdd.wisc.edu"
# Allow provision of an API Key for private collections
ARG XDD_API_KEY

WORKDIR /user
COPY ./package.json ./lerna.json /user/
COPY ./frontend-shared/package.json /user/frontend-shared/

RUN npm install

COPY . /user

WORKDIR /user/apps/visualizer-xdd

RUN webpack

FROM nginx

COPY ./docker-cfg/nginx.frontend-only.conf /etc/nginx/nginx.conf
COPY --from=base /user/apps/visualizer-xdd/dist /frontend