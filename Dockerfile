FROM node:24
ARG BUILD_ID=local
ENV TAISTO_BUILD_ID=$BUILD_ID
ENV TAISTO_AUDIT_RETENTION_DAYS=90
WORKDIR /usr/src
COPY backend backend
COPY js js
COPY public public
COPY scripts scripts
ADD .babelrc ./.babelrc
COPY .npmrc .npmrc
ADD package.json package.json
ADD package-lock.json package-lock.json
ADD webpack.config.js webpack.config.js
ADD app.js app.js
ADD apua.md apua.md
ADD CHANGELOG.md CHANGELOG.md
RUN node -e "require('fs').writeFileSync('js/build-info.js', 'export default { id: ' + JSON.stringify(process.env.TAISTO_BUILD_ID) + ' };\\n')"
RUN npm ci
RUN npm run build
RUN mkdir -p database
EXPOSE 80
CMD ["npm", "run", "app"]
