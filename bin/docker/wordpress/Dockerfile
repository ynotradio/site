FROM wordpress:latest

COPY --from=composer:2.0.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

ADD ./src/composer/composer.json composer.json