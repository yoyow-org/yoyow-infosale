"use strict";

var path = require('path');
var webpack = require('webpack');
var fs = require('fs');

var nodeModules = {};

fs.readdirSync('node_modules')
  .filter(function (x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = function (env) {
  return {
    devtool: 'cheap-eval-source-map',
    entry: './server.js',
    output: {
      filename: 'share-content.js',
      path: path.resolve(__dirname, 'dist')
    },
    module: {
      rules: [{
        test: /\.js$/,
        loader: "babel-loader",
        exclude: [/node_modules/],
      }]
    },
    plugins: [],
    // TODO: 排除不需要打包的nodemodule，没有这句多话会出现找不到node服务系列的包的情况，如Can't resolve 'net'
    target: 'node',
  }
};