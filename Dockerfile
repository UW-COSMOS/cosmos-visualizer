FROM node:8

WORKDIR /user/

RUN npm install -g parcel-bundler

COPY ./index.html /user/
COPY ./package.json /user/

RUN npm install

ENV API_BASE_URL=http://localhost:5454/api/
ENV IMAGE_BASE_URL=http://localhost:5454/images/
ENV PUBLIC_URL=/

EXPOSE 1234
EXPOSE 34365

# Should change to straight build
CMD ["parcel", "--hmr-port", "34365", "index.html"]
