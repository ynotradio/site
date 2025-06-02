<?php

$page_file = "story_delete.php";
$page_title = "Delete a Story";

require ("../functions/main_fns.php");
require ("../models/StoryFactory.php");
require ("../partials/_story_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$storyModel = \YNotRadio\Models\StoryFactory::create($db);

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Story</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        $story = $storyModel->getById($id);
        $result = $storyModel->delete($id);
        if ($result) {
          echo "<div class=\"center\"><h1>Success!</h1>".
          "<h3>The story <span class=\"success\">". $story['headline'] ."</span> has been deleted.</h3></div>";
        } else {
          echo '<div class="top-spacer_20 center error">Error deleting the story</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="story_view_all.php">View all Stories</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
