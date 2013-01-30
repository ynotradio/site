<?php

$page_file = "concert_update.php";
$page_title = "Update Concert";

require ("functions/main_fns.php");
require ("functions/concert_fns.php");
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
    <h1>Update Concert</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $concert = get_concert($id);
        echo "<form action=\"concert_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_concert_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $date = $_POST['date'];
        $artist = $_POST['artist'];
        $band_pic_url = $_POST['band_pic_url'];
        $band_url = $_POST['band_url'];
        $venue = $_POST['venue'];
        $ticketinfo = $_POST['ticketinfo'];
        $ticketurl = $_POST['ticketurl'];
        $featured = $_POST['featured'];

        if (!$date || !$artist || !$venue || !$ticketinfo || !$ticketurl) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_concert($id, $date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_concert(get_concert($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="concert_view_all.php">Back to all Concerts</a>
      <p>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
