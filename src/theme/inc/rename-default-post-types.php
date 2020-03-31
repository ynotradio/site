<?php

function change_post_label()
{
    global $menu;
    global $submenu;
    $menu[5][0] = 'Stories';
    $submenu['edit.php'][5][0] = 'Stories';
    $submenu['edit.php'][10][0] = 'Add Story';
    $submenu['edit.php'][16][0] = 'Story Tags';

}

add_action('admin_menu', 'change_post_label');

function change_page_label()
{
    global $menu;
    global $submenu;
    $menu[20][0] = 'Pages (Custom Text)';

}

add_action('admin_menu', 'change_page_label');

function change_users_label()
{
    global $menu;
    global $submenu;
    $menu[70][0] = 'Deejays / Users';
}

add_action('admin_menu', 'change_users_label');
