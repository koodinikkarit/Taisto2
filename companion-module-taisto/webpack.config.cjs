const createCompanionConfig = require("@companion-module/tools/webpack.config.cjs");

module.exports = (env = {}, argv = {}) => createCompanionConfig(
  Object.assign({}, env, { ROOT: __dirname }),
  argv
);
