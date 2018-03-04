FROM node:9.3-stretch
WORKDIR /usr/src
COPY backend backend
COPY js js
COPY public public
COPY scripts scripts
ADD .babelrc ./.babelrc
ADD package.json package.json
ADD server.js server.js
ADD webpack.config.js webpack.config.js
ADD app.js app.js
RUN npm install
RUN npm run build
CMD ["npm", "run", "app"]