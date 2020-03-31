<?php

use Carbon_Fields\Container;
use Carbon_Fields\Field;

function crb_register__deejay_users()
{

    Container::make('user_meta', 'Public Profile Information')
        ->add_fields(array(
            Field::make('text', 'crb_deejay__show_name', 'Show'),
            Field::make('text', 'crb_deejay__social_text', 'Social Text'),
            Field::make('text', 'crb_deejay__social_url', 'Social URL'),
            Field::make('text', 'crb_deejay__picture', 'Picture (Imported)'),
        ));
}

add_action('carbon_fields_register_fields', 'crb_register__deejay_users');
