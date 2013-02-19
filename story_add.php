<?php

$page_file = "story_add.php";
$page_title = "Add a Story";

require ("functions/main_fns.php");
require ("functions/story_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Story</h1>
      <?php if ($action != "insert") { ?>
      <form action="story_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_story_form.php"); ?>
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
        else
          add_story($headline, $story, $start_date, $end_date, $pic, $pic_url, $priority);
      }
    ?>
    <div class="top-spacer_20">
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
