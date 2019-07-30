FROM node:11-alpine
WORKDIR /user

COPY ./package.json /user
COPY ./ui-components/ /user/ui-components

# hacky fix for ui-components compilation issues
COPY ./ui-components_package.json /user/ui-components/package.json
COPY ./webpack.config.js /user

RUN npm config set unsafe-perm true \
    && npm install -g linklocal webpack webpack-cli  \
    && echo "Installing node modules" \
    && npm install \
    && cd ui-components && npm install && cd .. \
    && npm config set unsafe-perm false

ENV PUBLIC_URL="/"
ENV API_BASE_URL="${PUBLIC_URL}search"
ENV IMAGE_BASE_URL="${PUBLIC_URL}images/"
ENV APPMODE="PREDICTION"

RUN echo "PUBLIC_URL: ${PUBLIC_URL}" \
        && echo "API_BASE_URL: ${API_BASE_URL}" \
        && echo "IMAGE_BASE_URL: $IMAGE_BASE_URL"
COPY ./src/ /user/src/
RUN webpack

FROM nginx:1.15
COPY --from=0 /user/dist /frontend
COPY ./nginx.conf /etc/nginx/nginx.conf
