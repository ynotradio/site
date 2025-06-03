<?php

$page_file = "music_delete.php";
$page_title = "Delete a New Music Entry";

require ("../functions/main_fns.php");
require ("../models/MusicFactory.php");
require ("../partials/_music_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$musicModel = \YNotRadio\Models\MusicFactory::create($db);

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a New Music Entry</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        $music = $musicModel->getById($id);
        $result = $musicModel->delete($id);
        if ($result) {
          echo "<div class=\"center\"><h1>Success!</h1>".
            "<h3>The new music entry <span class=\"success\">". $music['artist'] ." - ".  $music['song'] ."</span> has been deleted.</h3></div>";
        } else {
          echo '<div class="top-spacer_20 center error">Error deleting the music entry</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="music_view_all.php">View all New Music</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
