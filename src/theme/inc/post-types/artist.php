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
        'supports' => array('title'),
    ));
}

add_action('init', 'create_post_type__artist');

use Carbon_Fields\Container;
use Carbon_Fields\Field;

function crb_register__artist()
{
    Container::make('post_meta', 'Artist Information')
        ->where('post_type', '=', 'artist')
        ->add_fields(array(
            Field::make('text', 'crb_artist__url', 'URL'),
            Field::make('text', 'crb_artist__picture', 'Picture (Imported)'),
        ));

    Container::make('post_meta', 'Social Links')
        ->where('post_type', '=', 'artist')
        ->add_fields(array(
            Field::make('complex', 'crb_artist__social_urls', 'Social Links')
                ->add_fields(array(
                    Field::make('text', 'label', 'Label')
                        ->set_width(50) // condense layout so field takes only 50% of the available width
                        ->set_required(),
                    Field::make('text', 'url', 'URL')
                        ->set_width(50)
                        ->set_required(),
                )
                ),
        ));
    Container::make('post_meta', 'Modern Rock Madness')
        ->where('post_type', '=', 'artist')
        ->add_fields(array(
            Field::make('text', 'crb_artist__abbreviation', 'Abbreviation')
                ->set_width(10),
        ));

}

add_action('carbon_fields_register_fields', 'crb_register__artist');

function custom_enter_title__artist($input)
{
    if ('artist' === get_post_type()) {
        return __('Enter artist or band name', 'ynotradio_text');
    }

    return $input;
}
add_filter('enter_title_here', 'custom_enter_title__artist');
