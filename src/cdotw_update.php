<?php

$page_file = "cdotw_update.php";
$page_title = "Update CD of the Week";

require ("functions/main_fns.php");
require ("functions/cdotw_fns.php");
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
    <h1>Update a CD of the Week</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $cdotw = get_cdotw($id);
        echo "<form action=\"cdotw_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_cdotw_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $artist = $_POST['artist'];
        $title = $_POST['title'];
        $label = $_POST['label'];
        $review = $_POST['review'];
        $cd_pic_url = $_POST['cd_pic_url'];
        $band_url = $_POST['band_url'];
        $reviewer = $_POST['reviewer'];
        $date = $_POST['date'];

        if (!$artist || !$title || !$label || !$review || !$cd_pic_url || !$band_url || !$reviewer || !$date) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_cdotw($id, $artist, $title, $label, $review, $cd_pic_url, $band_url, $reviewer, $date);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_cdotw(get_cdotw($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="cdotw_view_all.php">View all CD of the Weeks</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
