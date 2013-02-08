<?php

$page_file = "music_add.php";
$page_title = "Add a Music";

require ("functions/main_fns.php");
require ("functions/music_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add Music</h1>
      <?php if ($action != "insert") { ?>
      <form action="music_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_music_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $date = $_POST['date'];
        $artist = $_POST['artist'];
        $song = $_POST['song'];
        $url = $_POST['url'];

        if (!$date || !$artist || !$song)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_music($date, $artist, $song, $url);
      }
    ?>
    <div class="top-spacer_20">
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
