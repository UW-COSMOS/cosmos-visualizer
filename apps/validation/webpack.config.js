const { EnvironmentPlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
let path = require("path");
let cfg = require("../../frontend-shared/webpack.config.js");

module.exports = function (env, argv) {
  let baseConfig = cfg(env, argv);
  baseConfig.output.path = path.resolve(__dirname, "dist");

  return {
    ...baseConfig,
    context: __dirname,
    entry: "./src/index.ts",
    plugins: [
      // Replace plugins entirely
      new HtmlWebpackPlugin({ title: "COSMOS validation app" }),
      new EnvironmentPlugin({
        XDD_BASE_URL: "https://xdd.wisc.edu",
        PUBLIC_URL: "/",
      }),
    ],
  };
};
