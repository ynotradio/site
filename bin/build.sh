#!/usr/bin/env bash
echo "Bundling JS..."
webpack --config ./bin/webpack/webpack.prod.config.js
echo "Compiling SCSS..."
node-sass ./src/theme/sass/style.scss -o ./src/theme
echo "Build complete!"