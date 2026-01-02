FROM php:7.4-fpm

# Install PostgreSQL client and dev libraries
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql mysqli \
    && rm -rf /var/lib/apt/lists/*

# Configure PHP-FPM to pass environment variables
RUN echo "clear_env = no" >> /usr/local/etc/php-fpm.d/www.conf

# Set working directory
WORKDIR /app
