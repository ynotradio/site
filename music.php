<?php

$page_file = "music.php";
$page_title = "New Music";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/music_fns.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>New Music</h1>
    <span class="subtitle">Click on the linked song titles to get free downloads of those tracks.</span>
    <?php display_music(); ?>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
