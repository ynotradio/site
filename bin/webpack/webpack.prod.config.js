'use strict';
var webpack = require('webpack');

var config = require('./webpack.base.config');

config.plugins = (config.plugins || []).concat([
	new webpack.optimize.UglifyJsPlugin({
	    mangle: {
	        except: ['$', 'exports', 'require']
	    }
	})
]);

module.exports = config;
