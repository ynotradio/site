<?php
use Carbon_Fields\Container;
use Carbon_Fields\Field;

function create_post_type__cd_of_the_week()
{
    register_post_type('cd_of_the_week',
        array(
            'labels'      => array(
                'name'          => __('CD of the Week'),
                'singular_name' => __('CD of the Week'),
                'add_new_item'  => __('Add New CD of the Week'),
            ),
            'public'      => true,
            'has_archive' => true,
            'rewrite'     => array('slug' => 'cd-of-the-week'),
            'menu_icon'   => 'dashicons-album',
        )
    );

    //remove_post_type_support( 'cd_of_the_week', 'editor');


}
add_action('init', 'create_post_type__cd_of_the_week');

function crb_register__cd_of_the_week()
{

    Container::make('post_meta', 'CD Information')
        ->where('post_type', '=', 'cd_of_the_week')
        ->add_fields(array(
            Field::make('date', 'cdotw_date', 'Week of:'),
            Field::make('text', 'cdotw_artist', 'Artist'),
            Field::make('text', 'cdotw_artist_url', 'Artist Website'),
            Field::make('text', 'cdotw_label', "Record Label"),
            Field::make('text', 'cdotw_reviewer', "Reviewer's Name"),
        ));

    Container::make('post_meta', 'CD Artwork')
        ->where('post_type', '=', 'cd_of_the_week')
        ->add_fields(array(
        	Field::make( 'image', 'cdotw_pic_img', "Upload CD Image" ),
        	Field::make( 'text', 'cdotw_pic_url', "Link External Image" ),
        ))
        ->set_context( 'side' )
        ->set_priority( 'low' );
}

add_action('carbon_fields_register_fields', 'crb_register__cd_of_the_week');
