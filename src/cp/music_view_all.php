<?php

$page_file = "music_view_all.php";
$page_title = "View All Music";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require ("../models/MusicFactory.php");
require ("../partials/_music_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$musicModel = \YNotRadio\Models\MusicFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all New Music</h1>
      <?php 
        $music_entries = $musicModel->getAll();
        
        echo '<ol>';
        foreach ($music_entries as $info) {
          display_music($info);
          echo'<br>[ <a href="music_update.php?id=' .$info['id']. '">Edit</a> | <a href="music_delete.php?id=' .$info['id']. '">Delete</a> ] <p>';
        }
        echo '</ol>';
      ?>
    <div class="top-spacer_20">
      <a href="<?php echo htmlspecialchars(get_payload_collection_url('songs')); ?>" target="_blank">View in Payload ↗</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
