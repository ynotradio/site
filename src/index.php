<?php

$page_file = "";
$page_title = "";

require ("functions/main_fns.php");
require ("models/StoryFactory.php");
require ("partials/_story_display_helpers.php");
require ("partials/_header.php");

$db = open_db();
$storyModel = \YNotRadio\Models\StoryFactory::create($db);
$story_groups = $storyModel->getAll();


/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns">
    <div class="stories-container">
      <div class="col-stories"><?php display_stories($story_groups[0]) ?></div>
      <div class="col-stories"><?php display_stories($story_groups[1]) ?></div>
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
