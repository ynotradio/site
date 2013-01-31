<?php

$page_file = "ad_update.php";
$page_title = "Update Ad";

require ("functions/main_fns.php");
require ("functions/ads_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Ad</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $ad = get_ad($id);
        echo "<form action=\"ad_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_ads_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $name = $_POST['name'];
        $start_date = $_POST['start_date'];
        $end_date = $_POST['end_date'];
        $pic_url = $_POST['pic_url'];
        $web_url = $_POST['web_url'];

        if (!$name || !$start_date || !$end_date || !$pic_url || !$web_url) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_ad($id, $name, $start_date, $end_date, $pic_url, $web_url);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_ad(get_ad($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="ad_view_all_active.php">Back to all ads</a>
      <p>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
