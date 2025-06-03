<?php

$page_file = "music.php";
$page_title = "New Music";

require ("functions/main_fns.php");
require ("models/MusicFactory.php");
require ("partials/_music_display_helpers.php");
require ("partials/_header.php");

$db = open_db();
$musicModel = \YNotRadio\Models\MusicFactory::create($db);

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>New Music</h1>
    <span class="subtitle">Click on the linked song titles to get free downloads of those tracks.</span>
    <?php display_all_music(); ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
