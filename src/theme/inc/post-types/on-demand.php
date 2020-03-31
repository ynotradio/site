<?php

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
