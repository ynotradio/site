<?php

$page_file = "ondemand_view_all.php";
$page_title = "View All On Demands";

require ("../functions/main_fns.php");
require ("../models/OnDemandFactory.php");
require ("../partials/_ondemand_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$onDemandModel = \YNotRadio\Models\OnDemandFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all On Demands</h1>
      <?php 
      $entries = $onDemandModel->getAllForAdmin();
      
      echo '<ol>';
      foreach ($entries as $entry) {
        display_on_demand($entry);
        echo '<br>[ <a href="ondemand.php?id=' . $entry['id'] . '" target=_new >Listen</a> | ' . 
             '<a href="ondemand_update.php?id=' . $entry['id'] . '">Edit</a> | ' . 
             '<a href="ondemand_delete.php?id=' . $entry['id'] . '">Delete</a> ] <p>';
      }
      echo '</ol>';
      ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
