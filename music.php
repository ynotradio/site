<?php

$page_file = "music.php";
$page_title = "New Music";

require ("functions/main_fns.php");
require ("functions/music_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>New Music</h1>
    <span class="subtitle">Click on the linked song titles to get free downloads of those tracks.</span>
    <?php display_music(); ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
