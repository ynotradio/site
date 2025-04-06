
<?php

// Read .env

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    $dotenv->required([
        'AUTH0_CLIENT_ID',
        'AUTH0_DOMAIN',
        'AUTH0_CLIENT_SECRET',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'DB_HOST',
    ]);
} catch (\Dotenv\Exception\InvalidPathException $ex) {
    // Ignore if no dotenv
}