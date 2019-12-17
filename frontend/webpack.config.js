let path = require('path');
const { EnvironmentPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let assetsDir = path.resolve(__dirname, "dist");
let assetsRoute = path.join(process.env.PUBLIC_URL);

let jsLoader = {
  loader: 'babel-loader',
  options: {
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: ["emotion"]
  }
};

let fontLoader = {
  loader: 'file-loader',
  options: {name: "fonts/[name].[ext]"}
};

let stylusLoader = {
  loader: 'stylus-relative-loader'
};

module.exports = {
  module: {
    rules: [
      {test: /\.coffee$/, use: [ jsLoader, "coffee-loader" ]},
      {test: /\.(js|jsx)$/, use: [ jsLoader ], exclude: /node_modules/ },
      {test: /\.styl$/, use: ["style-loader", "css-loader", stylusLoader]},
      {test: /\.css$/, use: ["style-loader", 'css-loader' ]},
      {test: /\.(eot|svg|ttf|woff|woff2)$/, use: [fontLoader]},
      {test: /\.md$/, use: ["html-loader","markdown-loader"]}
    ]
  },
  devtool: 'source-map',
  resolve: {
    extensions: [".coffee", ".js", ".styl",".css",".html",".md"],
    alias: {
      "app": path.resolve(__dirname, "src/"),
    }
  },
  entry: './src/index.coffee',
  output: {
    path: assetsDir,
    publicPath: assetsRoute,
    filename: "[name].js"
  },
  plugins: [
    new HtmlWebpackPlugin({title: "COSMOS"}),
    new EnvironmentPlugin([
      'DEBUG',
      'PUBLIC_URL',
      'API_BASE_URL',
      'IMAGE_BASE_URL',
      'APPMODE'
    ])
  ]
}
