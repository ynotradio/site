<?php

$page_file = "cdotw_update.php";
$page_title = "Update CD of the Week";

require ("functions/main_fns.php");
require ("partials/_header.php");
require_once ("models/CdOfTheWeekFactory.php");

$id = $_GET['id'] ?? null;
$action = $_POST['action'] ?? 'update';

if (!$_SESSION["logged_in"]) {
    login_prompt($_POST['username'], $_POST['remember_me'], $_SESSION["error"]);
} else {
    /*----- CONTENT ------*/
    ?>
    <div class="row">
        <div class="twelve columns content full-width">
            <h1>Update a CD of the Week</h1>
            <?php
            try {
                $db = open_db(); // Get database connection
                $cdOfTheWeek = \YNotRadio\Models\CdOfTheWeekFactory::create($db);
                
                if (!$id) {
                    echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
                } elseif (!isset($_POST['artist'])) { // If form hasn't been submitted
                    // Display the form with existing data
                    $cdotw = $cdOfTheWeek->getById($id);
                    if ($cdotw) {
                        require ("partials/_cdotw_form.php");
                    } else {
                        echo '<div class="top-spacer_20 center error">CD of the Week not found</div>';
                    }
                } else {
                    // Process the form submission
                    $data = [
                        'artist' => $_POST['artist'],
                        'title' => $_POST['title'],
                        'label' => $_POST['label'],
                        'review' => $_POST['review'],
                        'cd_pic_url' => $_POST['cd_pic_url'],
                        'band' => $_POST['band'],
                        'reviewer' => $_POST['reviewer'],
                        'date' => $_POST['date']
                    ];
                    try {
                        $success = $cdOfTheWeek->update($id, $data);
                        if ($success) {
                            echo '<div class="top-spacer_20 center success">CD of the Week has been updated successfully!</div>';
                            echo '<div class="top-spacer_20">';
                            echo '<a href="cdotw_view_all.php">View all CDs of the Week</a><br>';
                            echo '<a href="cp.php">Control Panel</a>';
                            echo '</div>';
                        } else {
                            echo '<div class="top-spacer_20 center error">Failed to update CD of the Week</div>';
                            require ("partials/_cdotw_form.php");
                        }
                    } catch (\InvalidArgumentException $e) {
                        echo '<div class="top-spacer_20 center error">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
                        require ("partials/_cdotw_form.php");
                    }
                }
            } catch (Exception $e) {
                error_log("Error in CD of the Week admin: " . $e->getMessage());
                echo '<div class="top-spacer_20 center error">Sorry, there was an error. Please try again later.</div>';
            }
            ?>
        </div>
    </div>
    <?php
    require ("partials/_footer.php");
}
?>
