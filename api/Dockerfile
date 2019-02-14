FROM node:8

RUN apt-get update \
 && apt-get install -y libpq-dev postgresql-client

WORKDIR /tmp
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
 && python get-pip.py
RUN pip install lxml pillow
RUN rm -rf /tmp

# For development
RUN npm install -g nodemon coffeescript

COPY ./package.json /src/package.json
WORKDIR /src
RUN npm install

COPY . /src

# Install all the application modules
RUN ./setup-secret-key

EXPOSE 5454

CMD ["./start-server"]

