<?php

/**
 * Database Connection Singleton
 * 
 * This class provides a single point of access to the database connection
 * and prevents multiple connections from being created.
 */
class Database
{
    private static $instance = null;
    private $connection;
    
    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct()
    {
        $this->connection = mysqli_connect(
            $_ENV['DB_HOST'] ?? 'mysql',
            $_ENV['DB_USER'] ?? 'ynot_sql_user',
            $_ENV['DB_PASS'] ?? 'ynot_sql_pass',
            $_ENV['DB_NAME'] ?? 'ynot_site'
        );
        
        if (!$this->connection) {
            die("Database connection failed: " . mysqli_connect_error());
        }
    }
    
    /**
     * Get the database connection instance
     * 
     * @return mysqli The database connection
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->connection;
    }
    
    /**
     * Prevent cloning of the instance
     */
    private function __clone() {}
    
    /**
     * Prevent unserializing of the instance
     */
    private function __wakeup() {}
}