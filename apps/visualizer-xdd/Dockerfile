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

ARG ENVIRONMENT="production"
ARG PUBLIC_URL="/"
ARG XDD_BASE_URL="https://xdd.wisc.edu"
# Allow provision of an API Key for private collections
ARG XDD_API_KEY

COPY . /user

RUN npm run build -w apps/visualizer-xdd

FROM nginx

COPY ./docker-cfg/nginx.frontend-only.conf /etc/nginx/nginx.conf
COPY --from=base /user/apps/visualizer-xdd/dist /frontend
