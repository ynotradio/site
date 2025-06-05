<?php

$page_file = "mrm_view_all.php";
$page_title = "View All Modern Rock Madness Bands";

require ("../functions/main_fns.php");
require ("../models/ModernRockMadnessFactory.php");
require ("../partials/_header.php");

$db = open_db();
$mrmModel = \YNotRadio\Models\ModernRockMadnessFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Modern Rock Madness Bands</h1>
    <?php 
      $bands = $mrmModel->getAllBands();
      if (!empty($bands)) {
        echo '<ol>';
        foreach ($bands as $band) {
          echo $mrmModel->displayBand($band);
          echo '<br>[ <a href="mrm_band_update.php?id=' . $band["id"] . '">Edit</a> | <a href="mrm_band_delete.php?id=' . $band["id"] . '">Delete</a> ] <p>';
        }
        echo '</ol>';
      } else {
        echo '<p>No bands found in the database.</p>';
      }
    ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
