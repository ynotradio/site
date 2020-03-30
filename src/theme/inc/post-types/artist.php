<?php

function create_post_type__artist()
{

    register_post_type('artist', array(
        'labels' => array(
            'name' => __('Artists'),
            'singular_name' => __('Artist'),
            'add_new_item' => __('Add Artist'),
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'artist'),
        'menu_icon' => 'dashicons-art',
    ));
}

add_action('init', 'create_post_type__artist');
