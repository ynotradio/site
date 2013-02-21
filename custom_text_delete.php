<?php

$page_file = "custom_text_delete.php";
$page_title = "Delete a Custom Text";

require ("functions/main_fns.php");
require ("functions/custom_text_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Custom Text</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        delete_custom_text($id);
      }
    ?>
    <div class="top-spacer_20">
      <a href="custom_text_view_all.php">View all Custom Texts</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
