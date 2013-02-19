<?php

$page_file = "top11_song_update.php";
$page_title = "Update a Top 11 SongDeejay";

require ("functions/main_fns.php");
require ("functions/top11_fns.php");
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
    <h1>Update a Top 11 Song</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $top11_song = get_top11_song($id);
        echo "<form action=\"top11_song_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_top11_song_form.php");
        echo "</form>";
      } else {
        $artist = $_POST['artist'];
        $song = $_POST['song'];

        if (!$artist || !$song) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_top11_song($id, $artist, $song);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_top11_song(get_top11_song($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="top11_song_view_all.php">View all Top 11 Songs</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
