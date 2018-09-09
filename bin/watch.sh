#!/usr/bin/env bash
concurrently --raw \
	"nodemon -C --ext scss --watch ./site/theme/sass --exec \"npm run lint:scss && node-sass ./site/theme/sass/style.scss -o ./site/theme\"" \
    "webpack --config ./bin/webpack/webpack.dev.config.js"