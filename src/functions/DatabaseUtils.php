<?php

/**
 * Database Utility Functions
 * 
 * This file contains utility functions for working with the database
 * in a more secure and consistent way.
 */

if (!class_exists('Database')) {
    require_once __DIR__ . '/Database.php';
}

/**
 * Execute a SQL query with parameters using prepared statements
 * 
 * @param string $sql The SQL query with placeholders (?, ?, ?)
 * @param array $params An array of parameters to bind
 * @param string $types The types of the parameters (i: integer, d: double, s: string, b: blob)
 * @return mysqli_result|bool The query result or false on failure
 */
function db_query($sql, $params = [], $types = null)
{
    $db = Database::getInstance();
    
    // If no parameters, just run the query directly
    if (empty($params)) {
        return mysqli_query($db, $sql);
    }
    
    // Prepare the statement
    $stmt = mysqli_prepare($db, $sql);
    if (!$stmt) {
        error_log("Failed to prepare statement: " . mysqli_error($db));
        return false;
    }
    
    // If types not provided, guess them
    if ($types === null) {
        $types = '';
        foreach ($params as $param) {
            if (is_int($param)) {
                $types .= 'i';
            } elseif (is_float($param)) {
                $types .= 'd';
            } elseif (is_string($param)) {
                $types .= 's';
            } else {
                $types .= 'b'; // Blob for everything else
            }
        }
    }
    
    // Bind parameters
    if (!empty($params)) {
        $bindParams = array_merge([$stmt, $types], $params);
        $refBindParams = [];
        
        // Create references for bind_param
        foreach ($bindParams as $key => $value) {
            $refBindParams[$key] = &$bindParams[$key];
        }
        
        call_user_func_array('mysqli_stmt_bind_param', $refBindParams);
    }
    
    // Execute the statement
    if (!mysqli_stmt_execute($stmt)) {
        error_log("Failed to execute statement: " . mysqli_stmt_error($stmt));
        mysqli_stmt_close($stmt);
        return false;
    }
    
    // Get the result
    $result = mysqli_stmt_get_result($stmt);
    mysqli_stmt_close($stmt);
    
    return $result;
}

/**
 * Get a single row from the database
 * 
 * @param string $sql The SQL query with placeholders
 * @param array $params An array of parameters to bind
 * @param string $types The types of the parameters
 * @return array|null The row as an associative array or null if not found
 */
function db_get_row($sql, $params = [], $types = null)
{
    $result = db_query($sql, $params, $types);
    
    if (!$result) {
        return null;
    }
    
    $row = mysqli_fetch_assoc($result);
    mysqli_free_result($result);
    
    return $row;
}

/**
 * Get multiple rows from the database
 * 
 * @param string $sql The SQL query with placeholders
 * @param array $params An array of parameters to bind
 * @param string $types The types of the parameters
 * @return array An array of rows
 */
function db_get_results($sql, $params = [], $types = null)
{
    $result = db_query($sql, $params, $types);
    
    if (!$result) {
        return [];
    }
    
    $rows = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $rows[] = $row;
    }
    
    mysqli_free_result($result);
    
    return $rows;
}

/**
 * Insert a record into the database
 * 
 * @param string $table The table name
 * @param array $data Associative array of column => value pairs
 * @return int|false The insert ID or false on failure
 */
function db_insert($table, $data)
{
    $db = Database::getInstance();
    
    $columns = array_keys($data);
    $values = array_values($data);
    $placeholders = array_fill(0, count($values), '?');
    
    $sql = sprintf(
        "INSERT INTO %s (%s) VALUES (%s)",
        $table,
        implode(', ', $columns),
        implode(', ', $placeholders)
    );
    
    $result = db_query($sql, $values);
    
    if (!$result) {
        return false;
    }
    
    return mysqli_insert_id($db);
}

/**
 * Update a record in the database
 * 
 * @param string $table The table name
 * @param array $data Associative array of column => value pairs to update
 * @param array $where Associative array of column => value pairs for WHERE clause
 * @return bool Whether the update was successful
 */
function db_update($table, $data, $where)
{
    $set = [];
    $setValues = [];
    
    foreach ($data as $column => $value) {
        $set[] = "$column = ?";
        $setValues[] = $value;
    }
    
    $whereClause = [];
    $whereValues = [];
    
    foreach ($where as $column => $value) {
        $whereClause[] = "$column = ?";
        $whereValues[] = $value;
    }
    
    $sql = sprintf(
        "UPDATE %s SET %s WHERE %s",
        $table,
        implode(', ', $set),
        implode(' AND ', $whereClause)
    );
    
    $result = db_query($sql, array_merge($setValues, $whereValues));
    
    return $result !== false;
}

/**
 * Delete a record from the database
 * 
 * @param string $table The table name
 * @param array $where Associative array of column => value pairs for WHERE clause
 * @return bool Whether the delete was successful
 */
function db_delete($table, $where)
{
    $whereClause = [];
    $whereValues = [];
    
    foreach ($where as $column => $value) {
        $whereClause[] = "$column = ?";
        $whereValues[] = $value;
    }
    
    $sql = sprintf(
        "DELETE FROM %s WHERE %s",
        $table,
        implode(' AND ', $whereClause)
    );
    
    $result = db_query($sql, $whereValues);
    
    return $result !== false;
}