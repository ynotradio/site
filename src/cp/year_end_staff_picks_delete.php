<?php

$page_file = "year_end_staff_picks_delete.php";
$page_title = "Delete Year End Staff Pick";

require ("../functions/main_fns.php");
require ("../models/YearEndStaffPickFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];
$db = open_db();
$staffPickModel = \YNotRadio\Models\YearEndStaffPickFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Year End Staff Pick</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        try {
          $staffPick = $staffPickModel->getById($id);
          if ($staffPickModel->delete($id)) {
            echo "<div class=\"center\"><h1>Success!</h1>".
                 "<h3>The Year End Staff Pick has been deleted.</h3></div>";
          }
        } catch (\Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="year_end_staff_picks_view_all.php">View all Year End Staff Picks</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
