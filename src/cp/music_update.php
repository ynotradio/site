<?php

$page_file = "music_update.php";
$page_title = "Update Music";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require ("../models/MusicFactory.php");
require ("../partials/_music_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$musicModel = \YNotRadio\Models\MusicFactory::create($db);

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a New Music Entry</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $music = $musicModel->getById($id);
        echo "<form action=\"music_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("../partials/_music_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $date = $_POST['date'];
        $artist = $_POST['artist'];
        $song = $_POST['song'];
        $url = $_POST['url'];

        if (!$date || !$artist || !$song) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $data = [
            'date' => $date,
            'artist' => $artist,
            'song' => $song,
            'url' => $url
          ];
          
          $result = $musicModel->update($id, $data);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_music($musicModel->getById($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="music_view_all.php">View all New Music</a>
      <p>
      <?php $payload_edit_url = $id ? get_payload_edit_url('songs', 'songs', (int) $id) : null; ?>
      <?php if ($payload_edit_url): ?>
        <a href="<?php echo htmlspecialchars($payload_edit_url); ?>" target="_blank">Edit in Payload ↗</a>
        <p>
      <?php endif; ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
