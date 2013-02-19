<?php

$page_file = "ondemand_add.php";
$page_title = "Add an On Demand";

require ("functions/main_fns.php");
require ("functions/on_demand_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add an On Demand</h1>
      <?php if ($action != "insert") { ?>
      <form action="ondemand_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_ondemand_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $date = $_POST['date'];
        $image = $_POST['image'];
        $headline = $_POST['headline'];
        $note = $_POST['note'];
        $songs = $_POST['songs'];
        $audio_id = $_POST['audio_id'];

        if (!$date || !$image || !$headline || !$note || !$songs || !$audio_id)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_on_demand($date, $image, $headline, $note, $songs, $audio_id);
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
