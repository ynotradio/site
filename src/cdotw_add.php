<?php

$page_file = "cdotw_add.php";
$page_title = "Add CD of the Week";

require ("functions/main_fns.php");
require ("partials/_header.php");
require_once ("models/CdOfTheWeekFactory.php");

$action = $_POST['action'] ?? 'add';

if (!$_SESSION["logged_in"]) {
    login_prompt($_POST['username'], $_POST['remember_me'], $_SESSION["error"]);
} else {
    /*----- CONTENT ------*/
    ?>
    <div class="row">
        <div class="twelve columns content full-width">
            <h1>Add a CD of the Week</h1>
            <?php
            try {
                $cdOfTheWeek = \YNotRadio\Models\CdOfTheWeekFactory::create($GLOBALS['db']);
                
                if ($action === 'add') {
                    // Display the form
                    $cdotw = [
                        'artist' => '',
                        'title' => '',
                        'label' => '',
                        'review' => '',
                        'cd_pic_url' => '',
                        'band' => '',
                        'reviewer' => '',
                        'date' => date('Y-m-d')
                    ];
                    require ("partials/_cdotw_form.php");
                } else {
                    // Process the form submission
                    $data = [
                        'artist' => $_POST['artist'],
                        'title' => $_POST['title'],
                        'label' => $_POST['label'],
                        'review' => $_POST['review'],
                        'cd_pic_url' => $_POST['cd_pic_url'],
                        'band' => $_POST['band_url'],
                        'reviewer' => $_POST['reviewer'],
                        'date' => $_POST['date']
                    ];
                    
                    try {
                        $id = $cdOfTheWeek->add($data);
                        echo '<div class="top-spacer_20 center success">CD of the Week has been added successfully!</div>';
                        echo '<div class="top-spacer_20">';
                        if ($action === 'insert') {
                            echo '<a href="' . $page_file . '">Add another CD of the Week</a><br>';
                        }
                        echo '<a href="cdotw_view_all.php">View all CDs of the Week</a><br>';
                        echo '<a href="cp.php">Control Panel</a>';
                        echo '</div>';
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
