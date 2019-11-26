FROM node:11-alpine
WORKDIR /user

COPY . /user

RUN npm install

ENV PUBLIC_URL="/cosmos_enriched_tables/"
ENV API_BASE_URL="${PUBLIC_URL}search"
ENV IMAGE_BASE_URL="${PUBLIC_URL}images/"
ENV APPMODE="PREDICTION"

RUN echo "PUBLIC_URL: ${PUBLIC_URL}" \
 && echo "API_BASE_URL: ${API_BASE_URL}" \
 && echo "IMAGE_BASE_URL: $IMAGE_BASE_URL"

# We could change this to bail with just "webpack" for non-development mode
CMD npm run-script watch
