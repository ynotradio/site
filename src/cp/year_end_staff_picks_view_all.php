<?php

$page_file = "year_end_staff_picks_view_all.php";
$page_title = "View All Year End Staff Picks";

require ("../functions/main_fns.php");
require ("../models/YearEndStaffPickFactory.php");
require ("../partials/_header.php");

$db = open_db();
$staffPickModel = \YNotRadio\Models\YearEndStaffPickFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>All Year End Staff Picks</h1>
      <?php 
      try {
        $staffPicks = $staffPickModel->getAll();
        
        echo '<ol>';
        foreach ($staffPicks as $pick) {
          echo "<li><b>Order:</b> ". $pick['order_id'] .
               "<br><b>HTML:</b> ". $pick['html'] .
               "<br>[ <a href=\"year_end_staff_picks_update.php?id=" . $pick['id'] . "\">Edit</a> | " .
               "<a href=\"year_end_staff_picks_delete.php?id=" . $pick['id'] . "\">Delete</a> ]</li><p>";
        }
        echo '</ol>';
      } catch (\Exception $e) {
        echo "<p class=\"error\">Error: " . $e->getMessage() . "</p>";
      }
      ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
