'use strict';

var config = require('./webpack.base.config');

config.devtool = 'source-map';

config.output.sourceMapFilename = "[file].map";

config.watch = true;

module.exports = config;
