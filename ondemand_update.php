<?php

$page_file = "ondemand_update.php";
$page_title = "Update On Demand";

require ("functions/main_fns.php");
require ("functions/on_demand_fns.php");
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
    <h1>Update an On Demand Entry</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $ondemand = get_on_demand($id);
        echo "<form action=\"ondemand_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_ondemand_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $date = $_POST['date'];
        $image = $_POST['image'];
        $headline = $_POST['headline'];
        $note = $_POST['note'];
        $songs = $_POST['songs'];
        $audio_id = $_POST['audio_id'];

        if (!$date || !$image || !$headline || !$note || !$songs || !$audio_id) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_on_demand($id, $date, $image, $headline, $note, $songs, $audio_id);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_on_demand(get_on_demand($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="ondemand_view_all.php">View all On Demands</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
