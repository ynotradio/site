<?php

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
    ));
}

add_action('init', 'create_post_type__schedule');
