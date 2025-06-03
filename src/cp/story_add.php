<?php

$page_file = "story_add.php";
$page_title = "Add a Story";

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
    <h1>Add a Story</h1>
      <?php if ($action != "insert") { ?>
      <form action="story_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("../partials/_story_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $headline = $_POST['headline'];
        $story = $_POST['story'];
        $start_date = $_POST['start_date'];
        $end_date = $_POST['end_date'];
        $pic = $_POST['pic'];
        $pic_url = $_POST['pic_url'];
        $priority = $_POST['priority'];

        if (!$start_date || !$end_date || !$headline || !$story || !$pic || !$pic_url || !$priority)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else {
          $data = [
            'headline' => $headline, 
            'story' => $story, 
            'start_date' => $start_date, 
            'end_date' => $end_date, 
            'pic' => $pic, 
            'pic_url' => $pic_url, 
            'priority' => $priority
          ];
          $newId = $storyModel->add($data);
          
          echo "<div class=\"center\"><h1>Success!</h1>".
               "<h3>New Story about ". $headline. ", has been saved</h3>".
               "<hr width=75%>";
          display_story($storyModel->getById($newId));
          echo "</div>";
        }
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Story</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
