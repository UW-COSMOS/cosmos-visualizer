FROM node:8

RUN apt -y update
RUN apt -y install sqlite3

WORKDIR /tmp
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
 && python get-pip.py
RUN pip install lxml pillow
RUN rm -rf /tmp

COPY . /src
WORKDIR /src

RUN npm install
RUN ./setup-secret-key

CMD ["./start-server"]

EXPOSE 5454
