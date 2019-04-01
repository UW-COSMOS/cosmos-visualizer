FROM node:8

RUN apt-get update \
 && apt-get install -y libpq-dev postgresql-client

WORKDIR /tmp
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
 && python get-pip.py
RUN pip install lxml pillow
RUN rm -rf /tmp

# For development
RUN npm install -g nodemon
WORKDIR /src

COPY package.json /src/
RUN npm install

COPY ./*.* /src/
COPY ./v1-routes/ /src/v1-routes/
COPY ./handlers/ /src/handlers/

# Install all the application modules
COPY ./start-server /src/

CMD ["./start-server"]

