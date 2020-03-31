<?php

/**
 * Activates the 'menu_order' filter and then hooks into 'menu_order'
 */
add_filter('custom_menu_order', function () {return true;});
add_filter('menu_order', 'my_new_admin_menu_order');
/**
 * Filters WordPress' default menu order
 */
function my_new_admin_menu_order($menu_order)
{
    // define your new desired menu positions here
    // for example, move 'upload.php' to position #9 and built-in pages to position #1
    $new_positions = array(
        'edit.php?post_type=page' => 2,
        'edit.php?post_type=cd_of_the_week' => 8,
        'users.php' => 10,
        'separator2' => 11,
    );
    // helper function to move an element inside an array
    function move_element(&$array, $a, $b)
    {
        $out = array_splice($array, $a, 1);
        array_splice($array, $b, 0, $out);
    }
    // traverse through the new positions and move
    // the items if found in the original menu_positions
    foreach ($new_positions as $value => $new_index) {
        if ($current_index = array_search($value, $menu_order)) {
            move_element($menu_order, $current_index, $new_index);
        }
    }
    return $menu_order;
};
