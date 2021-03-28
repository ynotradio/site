<?php
/**
 * Database migrations for version 2.0.0
 */

global $wpdb;

class Migrate_2_0_0 extends Migration
{

    private $__wpdb;

    public function __construct($wpdb)
    {
        $this->wpdb = $wpdb;
        include 'config-2.0.0.php';
        $this->log('Configuring migration...');

    }
    public function run()
    {
        $this->log('Running migration to 2.0.0...');
        $this->__importCDOTW();
        $this->__importCustomText();
    }

    /**
     * CDOTW
     */

    private function __importCDOTW()
    {
        $this->log("****************************************");
        $this->log("Importing CD of the Week");
        $rows = $this->migration_db->get_results("SELECT * from cdotw");
        $this->log("Found " . count($rows) . " cdotw rows to import");

        foreach ($rows as $obj):
            $this->log($obj->title);
            if ($this->__checkForUniqueCDOTW($obj->id)) {
                $this->__addCDOTW($obj);
            };
        endforeach;
        $this->log("****************************************");
    }

    private function __checkForUniqueCDOTW($id)
    {
        $args = array(
            'post_type' => 'cd_of_the_week',
            'post_status' => 'any',
            'meta_query' => array(
                array(
                    'key' => '_cdotw_legacy_id',
                    'value' => $id,
                    'compare' => '=',
                ),
            ),
        );
        $query = new WP_Query($args);
        return $query->found_posts <= 0;
    }

    private function __addCDOTW($obj)
    {
        wp_insert_post(array(
            'post_title' => $obj->title,
            'post_type' => 'cd_of_the_week',
            'post_status' => 'publish',
            'post_date' => $obj->date,
            'post_content' => $obj->review,
            'meta_input' => array(
                '_cdotw_artist' => $obj->artist,
                '_cdotw_artist_url' => $obj->band,
                '_cdotw_legacy_id' => $obj->id,
                '_cdotw_label' => $obj->label,
                '_cdotw_reviewer' => $obj->reviewer,
                '_cdotw_pic_url' => $obj->cd_pic_url,
                '_cdotw_date' => $obj->date,
            ),
        ));
    }

    /**
     * Custom Texts
     */

    private function __importCustomText()
    {
        $this->log("****************************************");
        $this->log("Importing Custom Texts");
        $rows = $this->migration_db->get_results("SELECT * from custom_texts");
        $this->log("Found " . count($rows) . " custom_texts rows to import");
        foreach ($rows as $obj):
            $this->log($obj->title);
            if ($this->__checkForUniqueCustomText($obj->id)) {
                $this->__addCustomText($obj);
            };
        endforeach;

        $this->log("****************************************");
    }

    private function __checkForUniqueCustomText($id)
    {
        $args = array(
            'post_type' => 'page',
            'post_status' => 'any',
            'meta_query' => array(
                array(
                    'key' => '_custom_texts_legacy_id',
                    'value' => $id,
                    'compare' => '=',
                ),
            ),
        );
        $query = new WP_Query($args);
        return $query->found_posts <= 0;
    }

    private function __addCustomText($obj)
    {
        $status = $obj->status === 'active' ? 'publish' : 'draft';
        $this->log($status);
        wp_insert_post(array(
            'post_title' => $obj->title,
            'post_type' => 'page',
            'post_status' => $obj->status === 'active' ? 'publish' : 'draft',
            'post_content' => $obj->html,
            'meta_input' => array(
                '_custom_texts_legacy_id' => $obj->id,
            ),
        ));
    }

}

$migration = new Migrate_2_0_0($wpdb);
$migration->run();
