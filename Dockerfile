FROM node:8

RUN npm install -g parcel-bundler linklocal

WORKDIR /user/

EXPOSE 1234
EXPOSE 34365

# Should change to straight build
CMD ["./run-docker"]
