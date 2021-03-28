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
        $this->__importDeejays();
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

    /**
     * Deejays
     */

    private function __importDeejays()
    {
        $this->log("****************************************");
        $this->log("Importing Deejays");
        $rows = $this->migration_db->get_results("SELECT * from deejays");
        $this->log("Found " . count($rows) . " deejays rows to import");
        foreach ($rows as $obj):
            $this->log($obj->name);
            if ($this->__checkForUniqueDeejay($obj->id)) {
                $this->__addDeejay($obj);
            };
        endforeach;

        $this->log("****************************************");
    }

    private function __checkForUniqueDeejay($id)
    {
        $args = array(
            'post_type' => 'user_meta',
            'post_status' => 'any',
            'meta_query' => array(
                array(
                    'key' => 'crb_deejay__legacy_id',
                    'value' => $id,
                    'compare' => '=',
                ),
            ),
        );
        $query = new WP_Query($args);
        return $query->found_posts <= 0;
    }

    private function __addDeejay($obj)
    {
        $role = $obj->deleted === 'no' ? 'contributor' : null;
        $user_id = wp_insert_user(array(
            'display_name' => $obj->name,
            'user_nickname' => $obj->name,
            'user_email' => $obj->email,
            'user_login' => $obj->email,
            'user_pass' => wp_generate_password(24, true),
            'user_role' => $role,
        ));

        add_user_meta($user_id, '_crb_deejay__legacy_id', $obj->id);
        add_user_meta($user_id, '_crb_deejay__show_name', strip_tags(str_replace('<', ' <', $obj->show)));
        add_user_meta($user_id, '_crb_deejay__picture', $obj->pic);
        add_user_meta($user_id, '_crb_deejay__legacy_sort', $obj->sort);

        if ($obj->external_connect_url) {
            add_user_meta($user_id, '_crb_deejay__social_urls|||0|value', '_');
            add_user_meta($user_id, '_crb_deejay__social_urls|label|0|0|value', $obj->external_connect_text);
            add_user_meta($user_id, '_crb_deejay__social_urls|url|0|0|value', $obj->external_connect_url);
        }

    }

}

$migration = new Migrate_2_0_0($wpdb);
$migration->run();
