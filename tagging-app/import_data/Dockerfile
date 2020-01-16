FROM python:3.6-alpine

RUN apk update &&\
    apk add postgresql-dev gcc  musl-dev postgresql

RUN apk add libxml2-dev libxslt-dev

WORKDIR /src
COPY ./requirements.txt /src/
RUN pip install -r requirements.txt

COPY ./run-docker /src
COPY ./import_data.py /src

CMD sh run-docker
