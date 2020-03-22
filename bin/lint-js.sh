#!/usr/bin/env bash
if [ -z "$production" ]; then 
	eslint ./src/theme/js/**/*.js || exit 0
else 
	eslint ./src/theme/js/**/*.js || exit 1
fi 