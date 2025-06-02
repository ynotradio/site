<?php

$page_file = "story_view_all.php";
$page_title = "View All Stories";

require ("../functions/main_fns.php");
require ("../models/StoryFactory.php");
require ("../partials/_story_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$storyModel = \YNotRadio\Models\StoryFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Stories</h1>
      <?php 
        $stories = $storyModel->getAllActive();
        
        echo '<ol>';
        foreach ($stories as $story) {
          display_story($story);
          echo '<br>[ <a href="story_update.php?id=' .$story['id']. '">Edit</a> | <a href="story_delete.php?id=' .$story['id']. '">Delete</a> ] <p>';
        }
        echo '</ol>';
      ?>
    <div class="top-spacer_20">
      <a href="stories_order.php">Order Stories</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
