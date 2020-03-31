<?php
use Carbon_Fields\Container;
use Carbon_Fields\Field;

function create_post_type__on_demand()
{

    register_post_type('on-demand', array(
        'labels' => array(
            'name' => __('On Demand Sessions'),
            'singular_name' => __('On Demand Session'),
            'add_new_item' => __('Add On Demand Session'),
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'on-demand'),
        'menu_icon' => 'dashicons-microphone',
    ));
}

add_action('init', 'create_post_type__on_demand');

function crb_register__on_demand()
{
    Container::make('post_meta', 'Audio')
        ->where('post_type', '=', 'on-demand')
        ->add_fields(array(

            Field::make('text', 'crb_on_demand__audio_id', "Audio ID"),
        ));
    Container::make('post_meta', 'Artist')
        ->where('post_type', '=', 'on-demand')
        ->add_fields(array(
            Field::make('association', 'crb_on_demand__artist', 'Artists')
                ->set_min(0)
                ->set_types(array(
                    array(
                        'type' => 'post',
                        'post_type' => 'artist',
                    ))),
        ));

    Container::make('post_meta', 'Details')
        ->where('post_type', '=', 'on-demand')
        ->add_fields(array(
            Field::make('date', 'crb_on_demand__recorded_date', 'Recorded on:'),

            Field::make('text', 'crb_on_demand__songs', "Songs"),
            Field::make('text', 'crb_on_demand__image_url', "Image (Imported)"),
            Field::make('hidden', 'crb_on_demand__legacy_id', 'ID (Imported)'),

        ));

}
add_action('carbon_fields_register_fields', 'crb_register__on_demand');
