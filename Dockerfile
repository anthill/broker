FROM ants/nodejs:v1
MAINTAINER Alexandre Vallette <alexandre.vallette@ants.builders>


RUN mkdir /broker
WORKDIR /broker

# install node modules
ADD app/package.json /broker/package.json
RUN npm install

