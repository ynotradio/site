<?php

$page_file = "top11_song_view_all.php";
$page_title = "View All Top 11 Songs";

require ("../functions/main_fns.php");
require_once ("../models/Top11Factory.php");
require ("../partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Top 11 Songs</h1>
    <?php 
      // Display all Top11 songs
      $songs = $top11Model->getAllSongs();
      
      echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">";
      echo "<thead><tr><th>Arist</th><th>Song</th><th colspan='2'>Actions</th></tr></thead>";
      
      foreach ($songs as $song) {
        echo "<tr>\n
          <td>".$song['artist'] . "</td>\n".
          "<td>" .$song['song']. "</td>\n".
          "<td><a href=\"top11_song_update.php?id=" .$song['id']. "\">Edit</a></td>\n".
          "<td><a href=\"top11_song_delete.php?id=" .$song['id']. "\">Delete</a></td>\n".
          "</tr>\n";
      }
      echo "</table>";
    ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
