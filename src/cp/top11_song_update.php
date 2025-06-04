<?php

$page_file = "top11_song_update.php";
$page_title = "Update a Top 11 Song";

require ("../functions/main_fns.php");
require_once ("../models/Top11Factory.php");
require ("../partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Top 11 Song</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $top11_song = $top11Model->getSong($id);
        echo "<form action=\"top11_song_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("../partials/_top11_song_form.php");
        echo "</form>";
      } else {
        $artist = $_POST['artist'];
        $song = $_POST['song'];

        if (!$artist || !$song) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          try {
            $result = $top11Model->updateSong($id, $artist, $song);
            if ($result) {
              $updatedSong = $top11Model->getSong($id);
              
              echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
              echo "<br><b>Artist:</b> ". $updatedSong['artist'].
                   "<br><b>Song:</b> ". $updatedSong['song'];
              echo "</div>";
            } else {
              echo '<div class="top-spacer_20 center error">Error updating the Top 11 song</div>';
            }
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
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
