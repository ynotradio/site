#!/usr/bin/env bash
concurrently --raw \
	"nodemon -C --ext scss --watch ./src/theme/sass --exec \"npm run lint:scss && node-sass ./src/theme/sass/style.scss -o ./src/theme\"" \
    "webpack --config ./bin/webpack/webpack.dev.config.js"