FROM node:8

RUN apt -y update
RUN apt -y install sqlite3
RUN apt -y install nginx

WORKDIR /user/src/

RUN git clone https://github.com/UW-COSMOS/image-tagger

WORKDIR /user/src/image-tagger

RUN npm install -g parcel-bundler

ENV API_BASE_URL=http://localhost/image-tagger-api/
ENV IMAGE_BASE_URL=http://localhost/
ENV PUBLIC_URL=/

RUN npm install
RUN parcel build index.html

ADD image_tagger.conf /etc/nginx/sites-enabled/default

#CMD ["nginx", "-c", "/etc/nginx/conf.d/image_tagger.conf", "-g", "daemon off;"]
CMD ["nginx", "-g", "daemon off;"]
