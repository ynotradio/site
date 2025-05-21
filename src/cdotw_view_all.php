<?php

$page_file = "cdotw_view_all.php";
$page_title = "View All CDs of the Week";

require ("functions/main_fns.php");
require ("partials/_header.php");
require_once ("models/CdOfTheWeekFactory.php");

if (!$_SESSION["logged_in"]) {
    login_prompt($_POST['username'], $_POST['remember_me'], $_SESSION["error"]);
} else {
    /*----- CONTENT ------*/
    ?>
    <div class="row">
        <div class="twelve columns content full-width">
            <h1>View All CDs of the Week</h1>
            <?php
            try {
                $cdOfTheWeek = \YNotRadio\Models\CdOfTheWeekFactory::create($GLOBALS['db']);
                $allCds = $cdOfTheWeek->getAll();
                
                if (empty($allCds)) {
                    echo '<div class="top-spacer_20 center">No CDs of the Week found</div>';
                } else {
                    echo '<ol>';
                    foreach ($allCds as $cd) {
                        echo '<li>';
                        echo '<b>Artist: </b>' . htmlspecialchars($cd['artist']) . '<br>';
                        echo '<b>Title: </b>' . htmlspecialchars($cd['title']) . '<br>';
                        echo '<b>Label: </b>' . htmlspecialchars($cd['label']) . '<br>';
                        echo '<b>Review: </b>' . htmlspecialchars($cd['review']) . '<br>';
                        echo '<b>Cover Art:</b><br>';
                        echo '<img src="' . htmlspecialchars($cd['cd_pic_url']) . '" width="200px"><br>';
                        echo '<b>Band Url: </b>' . htmlspecialchars($cd['band']) . '<br>';
                        echo '<b>Reviewer: </b>' . htmlspecialchars($cd['reviewer']) . '<br>';
                        echo '<b>Date:</b> ' . htmlspecialchars($cd['date']);
                        echo '<br>[ <a href="cdotw_update.php?id=' . $cd['id'] . '">Edit</a> | ';
                        echo '<a href="cdotw_delete.php?id=' . $cd['id'] . '">Delete</a> ] <p>';
                        echo '</li>';
                    }
                    echo '</ol>';
                }
            } catch (Exception $e) {
                error_log("Error in CD of the Week admin: " . $e->getMessage());
                echo '<div class="top-spacer_20 center error">Sorry, there was an error. Please try again later.</div>';
            }
            ?>
            <div class="top-spacer_20">
                <a href="cdotw_add.php">Add a CD of the Week</a><br>
                <a href="cp.php">Control Panel</a>
            </div>
        </div>
    </div>
    <?php
    require ("partials/_footer.php");
}
?>
