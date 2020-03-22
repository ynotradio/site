#!/usr/bin/env bash
if [ -z "$production" ]; then 
	sass-lint './src/theme/sass/**/*.scss' --verbose --no-exit || exit 0
else 
	sass-lint './src/theme/sass/**/*.scss' --verbose || exit 1
fi 