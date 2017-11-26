<?php

function create_post_type__cd_of_the_week()
{
    register_post_type('cd_of_the_week',
        array(
            'labels'       => array(
                'name'          => __('CD of the Week'),
                'singular_name' => __('CD of the Week'),
                'add_new_item' => __('Add New CD of the Week'),
            ),
            'public'       => true,
            'has_archive'  => true,
            'rewrite'      => array('slug' => 'cd-of-the-week'),
            'menu_icon'    => 'dashicons-album',
        )
    );
}
add_action('init', 'create_post_type__cd_of_the_week');
