<?php

$page_file = "ondemand_add.php";
$page_title = "Add an On Demand";

require ("../functions/main_fns.php");
require ("../models/OnDemandFactory.php");
require ("../partials/_ondemand_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$onDemandModel = \YNotRadio\Models\OnDemandFactory::create($db);

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add an On Demand</h1>
      <?php if ($action != "insert") { ?>
      <form action="ondemand_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("../partials/_ondemand_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $date = $_POST['date'];
        $image = $_POST['image'];
        $headline = $_POST['headline'];
        $note = $_POST['note'];
        $songs = $_POST['songs'];
        $audio_id = $_POST['audio_id'];

        if (!$date || !$image || !$headline || !$note || !$songs || !$audio_id)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else {
          $data = [
            'date' => $date,
            'image' => $image,
            'headline' => $headline,
            'note' => $note,
            'songs' => $songs,
            'audio_id' => $audio_id
          ];
          
          $newId = $onDemandModel->add($data);
          
          echo "<div class=\"center\"><h1>Success!</h1>".
               "<h3>New On Demand, ". $headline. ", has been saved</h3>".
               "<hr width=75%>";
          display_on_demand($onDemandModel->getById($newId));
          echo "</div>";
        }
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another On Demand</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
