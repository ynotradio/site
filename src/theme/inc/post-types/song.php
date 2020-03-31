<?php

use Carbon_Fields\Container;
use Carbon_Fields\Field;

function create_post_type__song()
{

    register_post_type('song', array(
        'labels' => array(
            'name' => __('Songs (New Music)'),
            'singular_name' => __('Song'),
            'add_new_item' => __('Add Song'),
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'song'),
        'menu_icon' => 'dashicons-media-audio',
        'supports' => array('title'),
    ));
}

add_action('init', 'create_post_type__song');

function crb_register__song()
{
    Container::make('post_meta', 'New Music Information')
        ->where('post_type', '=', 'song')
        ->add_fields(array(
            Field::make('date', 'crb_song__date', 'Week of:'),
            Field::make('association', 'crb_song__artist', 'Artist')
                ->set_min(1)
                ->set_types(array(
                    array(
                        'type' => 'post',
                        'post_type' => 'artist',
                    ))),
            Field::make('text', 'crb_song__url', "Song URL"),
            Field::make('hidden', 'crb_song__legacy_id', 'ID (Imported)'),
        ));
}

add_action('carbon_fields_register_fields', 'crb_register__song');

function custom_enter_title__song($input)
{
    if ('song' === get_post_type()) {
        return __('Enter song title', 'ynotradio_text');
    }

    return $input;
}
add_filter('enter_title_here', 'custom_enter_title__song');
