<?php

$page_file = "ondemand_delete.php";
$page_title = "Delete an On Demand";

require ("../functions/main_fns.php");
require ("../models/OnDemandFactory.php");
require ("../partials/_ondemand_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$onDemandModel = \YNotRadio\Models\OnDemandFactory::create($db);

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete an On Demand</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        $ondemand = $onDemandModel->getById($id);
        if ($ondemand) {
          $result = $onDemandModel->delete($id);
          if ($result) {
            echo "<div class=\"center\"><h1>Success!</h1>".
            "<h3>The on demand entry <span class=\"success\">". $ondemand['headline'] ."</span>, has been deleted.</h3></div>";
          } else {
            echo '<div class="top-spacer_20 center error">Error deleting the on demand entry</div>';
          }
        } else {
          echo '<div class="top-spacer_20 center error">Error - on demand entry not found</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="ondemand_view_all.php">View all On Demands</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
