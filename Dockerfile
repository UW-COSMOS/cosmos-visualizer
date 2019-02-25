FROM node:8

RUN npm install -g parcel-bundler linklocal

WORKDIR /user/

ENV PUBLIC_URL=/
ENV API_BASE_URL="${PUBLIC_URL}/api"
ENV IMAGE_BASE_URL="${PUBLIC_URL}/images/"

EXPOSE 1234
EXPOSE 34365

# Should change to straight build
CMD ["./run-docker"]
