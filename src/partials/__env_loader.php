
<?php

// Read .env

try {
    // Try .env.local first (for development), then fall back to .env (for production)
    if (file_exists(__DIR__ . '/.env.local')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__, '.env.local');
    } else {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    }
    
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