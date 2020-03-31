<?php

function create_post_type__song()
{

    register_post_type('song', array(
        'labels' => array(
            'name' => __('Songs'),
            'singular_name' => __('Song'),
            'add_new_item' => __('Add Song'),
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'song'),
        'menu_icon' => 'dashicons-media-audio',
    ));
}

add_action('init', 'create_post_type__song');

function custom_enter_title__song($input)
{
    if ('song' === get_post_type()) {
        return __('Enter song title', 'ynotradio_text');
    }

    return $input;
}
add_filter('enter_title_here', 'custom_enter_title__song');
