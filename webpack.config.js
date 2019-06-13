const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const CircularDependencyPlugin = require('circular-dependency-plugin')

module.exports = {
  target: "node",
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "gateway-software.js"
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'src')]
  },
  resolveLoader: {
    modules: ['node_modules', path.resolve(__dirname, 'src')]
  },
  module: {
    rules : [
       {
         test: /\.js$/,
         exclude: /node_modules/,
         use: ['babel-loader'],
       }
    ]
  },
  externals: [nodeExternals()],
  plugins: [
    new CopyWebpackPlugin(['package.json', { from: 'src/software', to: 'software' }, { from: 'src/bin', to: 'bin' }]),
    new CircularDependencyPlugin({ exclude: /a\.js|node_modules/, failOnError: true, cwd: process.cwd() })
  ],
  devtool: false
}
