FROM node:7
MAINTAINER Gabriel Esteban <yufuven@gmail.com>

RUN mkdir -p /usr/sschat
COPY . /usr/sschat
WORKDIR /usr/sschat

RUN npm install --production

EXPOSE 4000

CMD ["npm", "start"]
