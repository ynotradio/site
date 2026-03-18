<?php

$page_file = "ondemand_update.php";
$page_title = "Update On Demand";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require ("../models/OnDemandFactory.php");
require ("../partials/_ondemand_display_helpers.php");
require ("../partials/_header.php");

$db = open_db();
$onDemandModel = \YNotRadio\Models\OnDemandFactory::create($db);

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
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
        $ondemand = $onDemandModel->getById($id);
        echo "<form action=\"ondemand_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("../partials/_ondemand_form.php");
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
          $data = [
            'date' => $date,
            'image' => $image,
            'headline' => $headline,
            'note' => $note,
            'songs' => $songs,
            'audio_id' => $audio_id
          ];
          
          $result = $onDemandModel->update($id, $data);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_on_demand($onDemandModel->getById($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="ondemand_view_all.php">View all On Demands</a>
      <p>
      <?php $payload_edit_url = $id ? get_payload_edit_url('ondemand', 'ondemand', (int) $id) : null; ?>
      <?php if ($payload_edit_url): ?>
        <a href="<?php echo htmlspecialchars($payload_edit_url); ?>" target="_blank">Edit in Payload ↗</a>
        <p>
      <?php endif; ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
