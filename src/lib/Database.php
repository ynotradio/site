<?php

namespace YNotRadio\Lib;

use PDO;
use PDOException;

/**
 * Database connection utility class
 * Provides connection to PostgreSQL using PDO
 */
class Database {
    private static ?PDO $postgresConnection = null;

    /**
     * Get PostgreSQL PDO connection
     * 
     * @return PDO PostgreSQL database connection
     * @throws PDOException if connection fails
     */
    public static function getPostgres(): PDO {
        if (self::$postgresConnection === null) {
            // Validate required environment variables
            $host = getenv('POSTGRES_HOST');
            $database = getenv('POSTGRES_DATABASE');
            $user = getenv('POSTGRES_USER');
            $password = getenv('POSTGRES_PASSWORD');

            if (!$host || !$database || !$user || !$password) {
                throw new PDOException(
                    'PostgreSQL connection requires POSTGRES_HOST, POSTGRES_DATABASE, ' .
                    'POSTGRES_USER, and POSTGRES_PASSWORD environment variables'
                );
            }

            $port = getenv('POSTGRES_PORT') ?: '5432';
            $sslMode = getenv('POSTGRES_SSL_MODE') ?: 'require';
            
            // Extract full endpoint ID from host for Neon compatibility (required for old libpq versions)
            $endpoint = '';
            if (preg_match('/^(ep-[a-z0-9-]+)/', $host, $matches)) {
                $endpoint = $matches[1];
            }

            // Build DSN
            $dsn = sprintf(
                "pgsql:host=%s;port=%s;dbname=%s;sslmode=%s",
                $host,
                $port,
                $database,
                $sslMode
            );
            
            // For old libpq versions without SNI support, add project parameter
            if ($endpoint) {
                $dsn .= ";options='project=$endpoint'";
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            self::$postgresConnection = new PDO($dsn, $user, $password, $options);
        }
        
        return self::$postgresConnection;
    }

    /**
     * Close the PostgreSQL connection
     */
    public static function closePostgres(): void {
        self::$postgresConnection = null;
    }
}
