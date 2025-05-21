<?php

namespace YNotRadio\Models;

class FeatureManager {
    private static $features = null;
    
    public static function isEnabled(string $feature): bool {
        if (self::$features === null) {
            self::$features = require __DIR__ . '/../config/features.php';
        }
        
        return self::$features[$feature] ?? false;
    }
    
    public static function getDataSource(): string {
        if (self::$features === null) {
            self::$features = require __DIR__ . '/../config/features.php';
        }
        
        return self::$features['default_data_source'] ?? 'sql';
    }
} 