FROM node:10.23.3-alpine3.11 AS builder

WORKDIR /zadig-portal

COPY package.json /zadig-portal/package.json

COPY yarn.lock /zadig-portal/yarn.lock

COPY build /zadig-portal/build

COPY config /zadig-portal/config

COPY src /zadig-portal/src

COPY static /zadig-portal/static

COPY .babelrc /zadig-portal/.babelrc

COPY .eslintignore /zadig-portal/.eslintignore

COPY .eslintrc.js /zadig-portal/.eslintrc.js

COPY .stylelintrc.json /zadig-portal/.stylelintrc.json

COPY .stylelintignore /zadig-portal/.stylelintignore

COPY .postcssrc.js /zadig-portal/.postcssrc.js

COPY index.html /zadig-portal/index.html

COPY zadig-nginx.conf /zadig-portal/zadig-nginx.conf

RUN yarn install 

RUN yarn run build

FROM nginx:1.20.2-alpine

WORKDIR /zadig-portal

COPY --from=builder /zadig-portal/dist /zadig-portal/

COPY --from=builder /zadig-portal/zadig-nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80