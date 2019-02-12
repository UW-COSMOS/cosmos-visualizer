FROM node:8

RUN apt -y update
RUN apt -y install sqlite3

WORKDIR /user/src/

RUN git clone https://github.com/UW-COSMOS/image-tagger-api

WORKDIR /user/src/image-tagger-api

RUN npm install
RUN cp api_key.js.example api_key.js && \
    uuid=$(node -e "const uuidv4 = require('uuid/v4'); console.log(uuidv4());") && \
    echo $uuid && \
    sed -i "s|secret key|$uuid|g" api_key.js && \
    sqlite3 annotations.sqlite < schema.sql &&\
    sqlite3 annotations.sqlite "INSERT INTO people (name) VALUES ('dummy');"

ADD docker_wrapper.sh /user/src/image-tagger-api/docker_wrapper.sh

EXPOSE 5454
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py &&\
    python get-pip.py

RUN pip install lxml &&\
    pip install pillow

CMD ["./docker_wrapper.sh"]
