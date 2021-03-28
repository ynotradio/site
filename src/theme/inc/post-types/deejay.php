<?php

use Carbon_Fields\Container;
use Carbon_Fields\Field;

function crb_register__deejay_users()
{

    Container::make('user_meta', 'Public Profile Information')
        ->add_fields(array(
            Field::make('text', 'crb_deejay__show_name', 'Show'),
            Field::make('text', 'crb_deejay__picture', 'Picture (Imported)'),
            Field::make('hidden', 'crb_deejay__legacy_id'),
            Field::make('hidden', 'crb_deejay__legacy_sort'),
        ));

    Container::make('user_meta', 'Social Links')
        ->add_fields(array(
            Field::make('complex', 'crb_deejay__social_urls', 'Social Links')
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
}

add_action('carbon_fields_register_fields', 'crb_register__deejay_users');
