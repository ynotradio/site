#!/usr/bin/env bash
if [ -z "$production" ]; then 
	sass-lint './site/theme/sass/**/*.scss' --verbose --no-exit || exit 0
else 
	sass-lint './site/theme/sass/**/*.scss' --verbose || exit 1
fi 