#!/usr/bin/env bash
echo "Bundling JS..."
webpack --config ./bin/webpack/webpack.prod.config.js
echo "Compiling SCSS..."
node-sass ./site/theme/sass/style.scss -o ./site/theme
echo "Build complete!"