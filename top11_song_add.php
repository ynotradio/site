<?php

$page_file = "top11_song_add.php";
$page_title = "Add a Top 11 Song";

require ("functions/main_fns.php");
require ("functions/top11_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Top 11 Song</h1>
      <?php if ($action != "insert") { ?>
      <form action="top11_song_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_top11_song_form.php"); ?>
      </form>
    <?php
      } else {
        $artist = $_POST['artist'];
        $song = $_POST['song'];

        if (!$artist || !$song)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_top11_song($artist, $song);
      }
    ?>
    <div class="top-spacer_20">
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
