FROM php:7.4-apache

RUN apt-get update \
  && apt-get install -y nano \
  && docker-php-ext-install pdo pdo_mysql mysqli

RUN docker-php-ext-enable mysqli