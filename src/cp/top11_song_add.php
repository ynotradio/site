<?php

$page_file = "top11_song_add.php";
$page_title = "Add a Top 11 Song";

require ("../functions/main_fns.php");
require_once ("../models/Top11Factory.php");
require ("../partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Top 11 Song</h1>
      <?php if ($action != "insert") { ?>
      <form action="top11_song_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("../partials/_top11_song_form.php"); ?>
      </form>
    <?php
      } else {
        $artist = $_POST['artist'];
        $song = $_POST['song'];

        if (!$artist || !$song) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          try {
            $newId = $top11Model->addSong($artist, $song);
            $newSong = $top11Model->getSong($newId);
            
            echo "<div class=\"center\"><h1>Success!</h1>".
                 "<h3>The new Top 11 song has been saved</h3>".
                 "<hr width=75%>";
            echo "<br><b>Artist:</b> ". $newSong['artist'].
                 "<br><b>Song:</b> ". $newSong['song'];
            echo "</div>";
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Top 11 Song</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
