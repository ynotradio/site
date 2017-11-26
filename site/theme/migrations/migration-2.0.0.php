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
        include 'config-2.0.0.php';
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

    private function getCDOTW()
    {
        $rows = $this->migration_db->get_results("select * from cdotw");
        foreach ($rows as $obj):
            $this->log($obj->title);
            if ($this->checkForUniqueCDOTW($obj->id)) {
                $this->addCDOTW($obj);
            };
        endforeach;
    }

    private function checkForUniqueCDOTW($id)
    {
        $args = array(
            'post_type'   => 'cd_of_the_week',
            'post_status' => 'any',
            'meta_query'  => array(
                array(
                    'key'     => '_cdotw_legacy_id',
                    'value'   => $id,
                    'compare' => '=',
                ),
            ),
        );
        $query = new WP_Query($args);
        return $query->found_posts <= 0;
    }

    private function addCDOTW($obj)
    {
        wp_insert_post(array(
            'post_title'   => $obj->title,
            'post_type'    => 'cd_of_the_week',
            'post_status' => 'publish',
            'post_date' => $obj->date,
            'post_content' => $obj->review,
            'meta_input'   => array(
                '_cdotw_artist'     => $obj->artist,
                '_cdotw_artist_url' => $obj->band,
                '_cdotw_legacy_id'  => $obj->id,
                '_cdotw_label'      => $obj->label,
                '_cdotw_reviewer'   => $obj->reviewer,
                '_cdotw_pic_url'    => $obj->cd_pic_url,
                '_cdotw_date'       => $obj->date,
            ),
        ));
    }
}

$migration = new Migrate_2_0_0($wpdb);
$migration->run();
