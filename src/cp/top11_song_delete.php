<?php

$page_file = "top11_song_delete.php";
$page_title = "Delete a Top 11 Song";

require ("../functions/main_fns.php");
require_once ("../models/Top11Factory.php");
require ("../partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
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
        try {
          // Get the song before deleting it
          $song = $top11Model->getSong($id);
          
          if ($song) {
            $success = $top11Model->deleteSong($id);
            
            if ($success) {
              echo "<div class=\"center\"><h1>Success!</h1>" .
                   "<h3>The Top 11 song <span class=\"success\">" . $song['song'] . " by " . $song['artist'] . "</span> has been deleted.</h3></div>";
            } else {
              echo '<div class="top-spacer_20 center error">Error deleting the Top 11 song</div>';
            }
          } else {
            echo '<div class="top-spacer_20 center error">Error: Song not found</div>';
          }
        } catch (\Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="top11_song_view_all.php">View all Top 11 Songs</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
