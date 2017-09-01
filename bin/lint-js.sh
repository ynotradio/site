#!/usr/bin/env bash
if [ -z "$production" ]; then 
	eslint ./site/theme/js/**/*.js || exit 0
else 
	eslint ./site/theme/js/**/*.js || exit 1
fi 