<?php

$page_file = "stories_order.php";
$page_title = "Order the Stories";

require ("../functions/main_fns.php");
require ("../models/StoryFactory.php");
require ("../partials/_story_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$storyModel = \YNotRadio\Models\StoryFactory::create($db);

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Current order of Stories</h1>
      <?php 
        if ($action == 'order') {
          $priorities = [];
          foreach ($_POST as $id=>$priority) { 
            if ($id != 'action') {
              $priorities[$id] = $priority;
            }
          }
          $storyModel->updatePriorities($priorities);
        }
        
        $stories = $storyModel->getAllActive();
        
        echo '<form action="stories_order.php" method="post">';
        foreach ($stories as $story) {
          echo "<div class=\"bottom-spacer_20\">
            Headline: <b>" . $story['headline']. "</b>
            <br>
            Priority: <input type=\"text\" class= \"input-xs\" value=\"".$story['priority']."\" name=\"".$story['id']."\">
            </div>";
        }
        echo "<input type=\"hidden\" name=\"action\" value=\"order\">
          <input type=\"submit\" class=\"btn-inverse\" value=\"Update Stories\">
          </form>";
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
