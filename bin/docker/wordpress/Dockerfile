FROM wordpress:latest

COPY --from=composer:1.9.3 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

ADD ./src/composer/composer.json composer.json
