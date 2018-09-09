'use strict';
var webpack = require('webpack');

var config = require('./webpack.base.config');

config.plugins = (config.plugins || []).concat([]);

module.exports = config;
