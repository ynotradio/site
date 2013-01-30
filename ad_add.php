<?php

$page_file = "ad_add.php";
$page_title = "Add an Ad";

require ("functions/main_fns.php");
require ("functions/ads_fns.php");
require ("partials/_header.php");

if ($_POST['action'] != "insert")
	$action = "insert";

$target = $_GET['target'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <?php if ($action == "insert") { ?>
    <h1>Add an Ad</h1>
    <form action="ad_add.php" method="post" class="form-internal inline input-seperation" id="admin">
    <?php require ("partials/_ads_form.php"); ?>
    </form>
    <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
  <?php
    } else {
      $start_date = $_POST['start_date'];
      $end_date = $_POST['end_date'];
      $name = $_POST['name'];
      $pic_url = $_POST['pic_url'];
      $web_url = $_POST['web_url'];

      if (!$start_date || !$end_date || !$name || !$pic_url || !$web_url) {
        echo '<div class="top-spacer_20 center error">Error - missing requried value(s)</div>';
      } else {
        add_ad($name, $start_date, $end_date, $pic_url, $web_url);
      }
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
