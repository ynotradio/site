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

// Interleave story groups so priority order is preserved on both desktop
// (two-column grid) and mobile (single-column stack).
$interleaved_stories = [];
$max_stories = max(count($story_groups[0]), count($story_groups[1]));
for ($idx = 0; $idx < $max_stories; $idx++) {
    if (isset($story_groups[0][$idx])) {
        $interleaved_stories[] = $story_groups[0][$idx];
    }
    if (isset($story_groups[1][$idx])) {
        $interleaved_stories[] = $story_groups[1][$idx];
    }
}
?>
<div class="row">
  <div class="nine columns">
    <div class="stories-container">
      <?php display_stories($interleaved_stories) ?>
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
