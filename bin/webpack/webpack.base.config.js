'use strict';

const path = require('path');

module.exports = {
    entry: {
        main: './src/theme/assets/js/main.js'
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../../src/theme/assets/js'),
    },
    plugins: [],
    watch: false
};