<?php

use Carbon_Fields\Container;
use Carbon_Fields\Field;

function create_post_type__schedule()
{

    register_post_type('schedule', array(
        'labels' => array(
            'name' => __('Schedules'),
            'singular_name' => __('Schedule'),
            'add_new_item' => __('Add Schedule Entry'),
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'schedule'),
        'menu_icon' => 'dashicons-format-chat',
        'supports' => array(null),
    ));
}

add_action('init', 'create_post_type__schedule');

function crb_register__schedule()
{
    Container::make('post_meta', 'Date')
        ->where('post_type', '=', 'schedule')
        ->add_fields(array(
            Field::make('date', 'crb_schedule__date', 'Date')
                ->set_required(),

        ));

    Container::make('post_meta', 'Shows')
        ->where('post_type', '=', 'schedule')
        ->add_fields(array(
            Field::make('complex', 'crb_schedule__shows', 'Shows')
                ->add_fields(array(
                    Field::make('text', 'show', 'Show Name'),
                    Field::make('association', 'host', 'Host / Deejay')
                        ->set_types(array(
                            array(
                                'type' => 'user',
                            ))),
                    Field::make('time', 'start_time', 'Start Time')
                        ->set_width(50) // condense layout so field takes only 50% of the available width
                        ->set_required(),
                    Field::make('time', 'end_time', 'End Time')
                        ->set_width(50) // condense layout so field takes only 50% of the available width
                        ->set_required(),

                    Field::make('rich_text', 'notes', 'Notes'),

                )),

        ));
}

add_action('carbon_fields_register_fields', 'crb_register__schedule');
