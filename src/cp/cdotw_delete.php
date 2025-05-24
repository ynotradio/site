<?php

$page_file = "cdotw_delete.php";
$page_title = "Delete CD of the Week";

require ("../functions/main_fns.php");
require ("../partials/_header.php");
require_once ("../models/CdOfTheWeekFactory.php");

$id = $_GET['id'] ?? null;

if (!$_SESSION["logged_in"]) {
    login_prompt($_POST['username'], $_POST['remember_me'], $_SESSION["error"]);
} else {
    /*----- CONTENT ------*/
    ?>
    <div class="row">
        <div class="twelve columns content full-width">
            <h1>Delete a CD of the Week</h1>
            <?php
            try {
                $db = open_db(); // Get database connection
                $cdOfTheWeek = \YNotRadio\Models\CdOfTheWeekFactory::create($db);
                
                if (!$id) {
                    echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
                } else {
                    $cd = $cdOfTheWeek->getById($id);
                    if ($cd) {
                        $success = $cdOfTheWeek->delete($id);
                        if ($success) {
                            echo '<div class="top-spacer_20 center success">';
                            echo '<h1>Success!</h1>';
                            echo '<h3>The CD of the Week entry for <span class="success">' . 
                                 htmlspecialchars($cd['artist']) . ' - ' . 
                                 htmlspecialchars($cd['title']) . 
                                 '</span> has been deleted.</h3>';
                            echo '</div>';
                        } else {
                            echo '<div class="top-spacer_20 center error">Failed to delete CD of the Week</div>';
                        }
                    } else {
                        echo '<div class="top-spacer_20 center error">CD of the Week not found</div>';
                    }
                }
            } catch (Exception $e) {
                error_log("Error in CD of the Week admin: " . $e->getMessage());
                echo '<div class="top-spacer_20 center error">Sorry, there was an error. Please try again later.</div>';
            }
            ?>
            <div class="top-spacer_20">
                <a href="cdotw_view_all.php">View all CDs of the Week</a><br>
                <a href="index.php">Control Panel</a>
            </div>
        </div>
    </div>
    <?php
    require ("../partials/_footer.php");
}
