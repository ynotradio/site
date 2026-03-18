<?php

$page_file = "ad_view_all_active.php";
$page_title = "View All Active Ads";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require_once ("../models/AdFactory.php");
require ("../partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

$db = open_db();
$adModel = \YNotRadio\Models\AdFactory::create($db);
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>All Active Ads</h1>
      <?php 
        $ads = $adModel->getAll(128); // Arbitrary high limit
        echo '<ol>';
        foreach ($ads as $ad) {
          echo '<li>';
          echo '<b>Name:</b> '.htmlspecialchars($ad['name']).'<br>';
          echo '<b>Start Date:</b> '.htmlspecialchars($ad['start_date']).'<br>';
          echo '<b>End Date:</b> '.htmlspecialchars($ad['end_date']).'<br>';
          echo '<b>Picture:</b><br> <img src="'.htmlspecialchars($ad['pic_url']).'" width="200px"><br>';
          echo '<b>Link:</b> '.htmlspecialchars($ad['web_url']).'<br>';
          echo '<b>Priority:</b> '.htmlspecialchars($ad['priority']).'<br>';
          echo '[ <a href="ad_update.php?id=' .htmlspecialchars($ad['id']). '">Edit</a> | <a href="ad_delete.php?id=' .htmlspecialchars($ad['id']). '">Delete</a> ] <p>';
          echo '</li>';
        }
        echo '</ol>';
      ?>
    <div class="top-spacer_20">
      <a href="<?php echo htmlspecialchars(get_payload_collection_url('ads')); ?>" target="_blank">View in Payload ↗</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
