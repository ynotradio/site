FROM mysql:8.0

# Configure MySQL to use native password authentication for root user
# This allows MYSQL_PWD environment variable to work correctly
ENV MYSQL_ROOT_HOST=%

# Skip automatic SQL init - will import manually after startup
