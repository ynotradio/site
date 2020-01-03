<?php

$page_file = "concert_add.php";
$page_title = "Add a Concert";

require ("functions/main_fns.php");
require ("functions/concert_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Concert</h1>
      <?php if ($action != "insert") { ?>
      <form action="concert_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_concert_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $date = $_POST['date'];
        $artist = $_POST['artist'];
        $band_pic_url = $_POST['band_pic_url'];
        $band_url = $_POST['band_url'];
        $venue = $_POST['venue'];
        $ticketinfo = $_POST['ticketinfo'];
        $ticketurl = $_POST['ticketurl'];
        $featured = $_POST['featured'];

        if (!$date || !$artist || !$venue || !$ticketinfo || !$ticketurl)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_concert($date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured);
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Concert</a>\n<p>";
      ?>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
