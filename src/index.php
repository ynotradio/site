<?php

$page_file = "";
$page_title = "";

require ("functions/main_fns.php");
require ("models/StoryFactory.php");
require ("partials/_story_display_helpers.php");
require ("partials/_header.php");

$storyModel = \YNotRadio\Models\StoryFactory::create();
$story_groups = $storyModel->getAll();


/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns">
    <!--
      Two-column DOM preserves desktop's independent column flow (each
      column's heights stack independently). On mobile (≤959px), CSS
      collapses the .stories-col wrappers via `display: contents` so the
      .feature-box divs become direct flex children of .stories-container,
      where the inline `order` style interleaves them back into strict
      priority order (1, 2, 3, …).
    -->
    <div class="stories-container">
      <div class="stories-col">
        <?php display_stories($story_groups[0], 0, 2) ?>
      </div>
      <div class="stories-col">
        <?php display_stories($story_groups[1], 1, 2) ?>
      </div>
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
