FROM python:3.6-alpine

RUN apk update &&\
    apk add postgresql-dev gcc  musl-dev postgresql jpeg-dev zlib-dev

RUN apk add libxml2-dev libxslt-dev

WORKDIR /src
COPY requirements.txt /src
RUN \
    pip install -r requirements.txt

COPY export_data.py /src

CMD python export_data.py /images/ /output/
