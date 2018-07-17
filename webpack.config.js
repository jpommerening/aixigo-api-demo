"use strict";
const path = require("path");
const VueLoaderPlugin = require("vue-loader").VueLoaderPlugin;

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  output: {
    path: resolve("dist"),
    filename: "[name].js",
    publicPath: "dist/"
  },
  resolve: {
    extensions: [".js", ".vue", ".json"],
    alias: {
      vue: "vue/dist/vue.min.js"
    }
  },
  devtool: "sourcemap",
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: "eslint-loader",
        enforce: "pre",
        include: [resolve("src"), resolve("test")]
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          transformToRequire: {
            video: ["src", "poster"],
            source: "src",
            img: "src",
            image: "xlink:href"
          }
        }
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        include: [
          resolve("src"),
          resolve("test"),
          resolve("node_modules/webpack-dev-server/client")
        ]
      },
      {
        test: /\.s?css$/,
        loader: ["style-loader", "postcss-loader"],
        include: [resolve("src"), resolve("test")]
      },
      {
        test: /\.scss$/,
        loader: "sass-loader",
        include: [resolve("src"), resolve("test")]
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "fonts/[name].[hash:7].[ext]"
        }
      }
    ]
  },
  plugins: [new VueLoaderPlugin()]
};
