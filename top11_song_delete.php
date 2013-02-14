<?php

$page_file = "top11_song_delete.php";
$page_title = "Delete a Top 11 Song";

require ("functions/main_fns.php");
require ("functions/top11_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Top 11 Song</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        delete_top11_song($id);
      }
    ?>
    <div class="top-spacer_20">
      <a href="top11_song_view_all.php">Back to all Top 11 Songs</a>
      <p>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
