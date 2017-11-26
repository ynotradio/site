<?php
/**
 * Database migrations for version 2.0.0
 */

global $wpdb;

class Migrate_2_0_0
{

    private $wpdb;

    public function __construct($wpdb)
    {
        $this->wpdb = $wpdb;
        include('config-2.0.0.php');
    }

    public function run()
    {
        $this->log('Running migration to 2.0.0...');
        $this->getCDOTW();
    }

    private function log($message)
    {
        echo $message . '<br />';
    }

    private function getCDOTW() {
        $rows = $this->migration_db->get_results("select * from cdotw");
        foreach ($rows as $obj) :
            $this->log($obj->title);
        endforeach;
    }
}

$migration = new Migrate_2_0_0($wpdb);
$migration->run();
