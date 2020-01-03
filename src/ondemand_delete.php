<?php

$page_file = "ondemand_delete.php";
$page_title = "Delete an On Demand";

require ("functions/main_fns.php");
require ("functions/on_demand_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
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
        delete_on_demand($id);
      }
    ?>
    <div class="top-spacer_20">
      <a href="ondemand_view_all.php">View all On Demands</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
