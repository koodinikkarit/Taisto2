FROM node:24
WORKDIR /usr/src
COPY backend backend
COPY js js
COPY public public
ADD .babelrc ./.babelrc
ADD package.json package.json
ADD package-lock.json package-lock.json
ADD server.js server.js
ADD webpack.config.js webpack.config.js
ADD app.js app.js
RUN npm install
RUN npm run build
CMD ["npm", "run", "app"]
