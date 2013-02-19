<?php

$page_file = "story_update.php";
$page_title = "Update Story";

require ("functions/main_fns.php");
require ("functions/story_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Story</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $story = get_story($id);
        echo "<form action=\"story_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_story_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $headline = $_POST['headline'];
        $story = $_POST['story'];
        $start_date = $_POST['start_date'];
        $end_date = $_POST['end_date'];
        $pic = $_POST['pic'];
        $pic_url = $_POST['pic_url'];
        $priority = $_POST['priority'];

        if (!$start_date || !$end_date || !$headline || !$story || !$pic || !$pic_url || !$priority) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_story($id, $headline, $story, $start_date, $end_date, $pic, $pic_url, $priority);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_story(get_story($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="story_view_all.php">View all Stories</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
