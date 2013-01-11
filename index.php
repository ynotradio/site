<?php

$page_file = "";
$page_title = "";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/story_fns.php");
open_db();
$amount_of_stories = "all";
$story_groups= get_stories($amount_of_stories);


/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns">
    <div class="row">
      <div class="six columns">
        <?php display_stories($story_groups[0]) ?>
      </div>
      <div class="six columns">
        <?php display_stories($story_groups[1])?>
      </div>
    </div>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
