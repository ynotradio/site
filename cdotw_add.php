<?php

$page_file = "cdotw_add.php";
$page_title = "Add CD of the Week";

require ("functions/main_fns.php");
require ("functions/cdotw_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a CD of the Week</h1>
      <?php if ($action != "insert") { ?>
      <form action="cdotw_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_cdotw_form.php"); ?>
      </form>
      <div class="footnote">** if the CD picture url or band url is over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $artist = $_POST['artist'];
        $title = $_POST['title'];
        $label = $_POST['label'];
        $review = $_POST['review'];
        $cd_pic_url = $_POST['cd_pic_url'];
        $band_url = $_POST['band_url'];
        $reviewer = $_POST['reviewer'];
        $date = $_POST['date'];

        if (!$artist || !$title || !$label || !$review || !$cd_pic_url || !$band_url|| !$reviewer || !$date)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_cdotw($artist, $title, $label, $review, $cd_pic_url, $band_url, $reviewer, $date);
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
