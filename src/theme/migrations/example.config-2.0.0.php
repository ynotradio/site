<?php

$migration_db_name = '';
$migration_db_user = '';
$migration_db_pass = '';
$this->migration_db = new wpdb($migration_db_user, $migration_db_pass, $migration_db_name,'localhost');

?>