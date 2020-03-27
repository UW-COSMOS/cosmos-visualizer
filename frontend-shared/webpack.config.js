let path = require('path');
const { EnvironmentPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let assetsDir = path.resolve(__dirname, "dist");
let assetsRoute = path.join(process.env.PUBLIC_URL || "/");

let jsLoader = {
  loader: 'babel-loader',
  options: {
    presets: ['@babel/preset-env', '@babel/preset-react', "@babel/preset-typescript"],
    plugins: [
      "emotion",
      "@babel/plugin-proposal-nullish-coalescing-operator",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-class-properties"
    ]
  }
};

let fontLoader = {
  loader: 'file-loader',
  options: {name: "fonts/[name].[ext]"}
};

let stylusLoader = {
  loader: 'stylus-relative-loader'
};

console.log(process.env)

// Watching issues! https://github.com/webpack/watchpack/issues/61

module.exports = (env, argv)=> {
  const mode = process.env.ENVIRONMENT || "production"

  return {
    module: {
      rules: [
        {test: /\.(js|jsx|ts|tsx)$/, use: [ jsLoader ], exclude: /node_modules/ },
        {test: /\.styl$/, use: ["style-loader", "css-loader", stylusLoader]},
        {test: /\.css$/, use: ["style-loader", 'css-loader' ]},
        {test: /\.(eot|svg|ttf|woff|woff2)$/, use: [fontLoader]},
        {test: /\.md$/, use: ["html-loader","markdown-loader"]}
      ]
    },
    context: __dirname,
    watchOptions: {
      poll: true,
      ignored: /node_modules/
    },
    cache: false,
    devtool: false, // mode == 'development' ? 'eval' : false,
    resolve: {
      extensions: [".js", ".ts", ".jsx", ".tsx", ".styl",".css",".html",".md"],
      symlinks: true,
      alias: {
        "~": path.resolve(__dirname, "src/"),
        "app": path.resolve(__dirname, "src/"),
        // Fix "two copies of react"
        "react": path.resolve(__dirname, "node_modules", "react"),
        "react-dom": path.resolve(__dirname, "node_modules", "react-dom"),
        "#": path.resolve(__dirname, "bundled-deps/ui-components/src")
      }
    },
    // entry must be passed as an argument to webpack
    entry: "./src/visualizer-app/index.ts",
    output: {
      path: assetsDir,
      publicPath: assetsRoute,
      filename: "[name].js"
    },
    plugins: [
      new HtmlWebpackPlugin({title: "COSMOS"}),
      new EnvironmentPlugin([
        'ENVIRONMENT',
        'DEBUG',
        'PUBLIC_URL',
        'API_BASE_URL',
        'IMAGE_BASE_URL',
        'APPMODE'
      ])
    ]
  }
}
