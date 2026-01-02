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
            
            // Extract endpoint ID from host for Neon compatibility
            $endpoint = '';
            if (preg_match('/^(ep-[^.]+)/', $host, $matches)) {
                $endpoint = $matches[1];
            }

            $dsn = sprintf(
                "pgsql:host=%s;port=%s;dbname=%s;sslmode=%s%s",
                $host,
                $port,
                $database,
                $sslMode,
                $endpoint ? ";options=endpoint=$endpoint" : ''
            );
            
            self::$postgresConnection = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
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
