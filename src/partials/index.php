<?php

$page_file = "";
$page_title = "";

require ("functions/main_fns.php");
require ("functions/story_fns.php");
require ("partials/_header.php");

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
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
