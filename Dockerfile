FROM node:24
WORKDIR /usr/src
COPY backend backend
COPY js js
COPY public public
ADD .babelrc ./.babelrc
ADD package.json package.json
ADD package-lock.json package-lock.json
ADD webpack.config.js webpack.config.js
ADD app.js app.js
RUN npm ci --legacy-peer-deps
RUN npm run build
RUN mkdir -p database
EXPOSE 80
CMD ["npm", "run", "app"]
