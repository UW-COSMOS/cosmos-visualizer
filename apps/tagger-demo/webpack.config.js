let path = require("path");
let cfg = require("../../frontend-shared/webpack.config.js");
module.exports = function (env, argv) {
  let baseConfig = cfg(env, argv);
  baseConfig.entry = "./src/index.ts";
  baseConfig.context = __dirname;
  baseConfig.output.path = path.resolve(__dirname, "dist");

  return baseConfig;
};
