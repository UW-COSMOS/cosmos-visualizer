FROM node:8

WORKDIR /user/

RUN npm install -g parcel-bundler

COPY ./index.html /user/
COPY ./package.json /user/

ENV API_BASE_URL=http://localhost/image-tagger-api/
ENV IMAGE_BASE_URL=http://localhost/
ENV PUBLIC_URL=/

RUN npm install

EXPOSE 1234
EXPOSE 34365

# Should change to straight build
CMD ["parcel", "--hmr-port", "34365", "index.html"]
