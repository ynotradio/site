'use strict';

const path = require('path');

module.exports = {
    entry: {
        main: './site/theme/assets/js/main.js'
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../../site/theme/assets/js'),
    },
    plugins: [
    ],
    watch: false
};
