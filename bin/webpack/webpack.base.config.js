'use strict';
module.exports = {
    entry: {
        main: './site/theme/assets/js/main.js'
    },
    output: {
        filename: 'bundle.js',
        path: './site/theme/assets/js'
    },
    plugins: [
    ],
    eslint: {
        configFile: './.eslintrc'
    },
    module: {
        preLoaders: [{
            test: /\.js$/,
            loader: 'eslint-loader',
            exclude: /node_modules/
        }]
    },
    watch: false
};
