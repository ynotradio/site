<?php

$migration_db_name = '';
$migration_db_user = '';
$migration_db_pass = '';
$migration_db_host = 'db'; // use 'db' instead of 'localhost' because it's the name of the docker image
$this->migration_db = new wpdb($migration_db_user, $migration_db_pass, $migration_db_name, $migration_db_host); 

?>