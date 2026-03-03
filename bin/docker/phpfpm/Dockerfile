FROM php:7.4-fpm

# Install PostgreSQL client and dev libraries
RUN apt-get update && apt-get install -y libpq-dev unzip curl \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql mysqli \
    && echo "clear_env = no" >> /usr/local/etc/php-fpm.d/www.conf \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app
