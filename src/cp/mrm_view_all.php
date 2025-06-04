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
        
        echo '<ol>';
        foreach ($bands as $band) {
          echo '<br><b>Name:</b> ' . $band['name'] .
               '<br><b>Name Abbr:</b> ' . $band['abbr'] .
               '<br><b>Url:</b> ' . $band['url'] .
               '<br><b>Seed:</b> ' . $band['seed'] .
               '<br><b>Picture:</b><br> <img src="' . $band['pic_url'] . '" width="250px"/>' .
               '<br><b>Placement:</b> ' . $band['placement'] .
               '<br><b>Sponsor:</b> ' . $band['sponsor'];
          echo '<br>[ <a href="mrm_band_update.php?id=' . $band["id"] . '">Edit</a> | <a href="mrm_band_delete.php?id=' . $band["id"] . '">Delete</a> ] <p>';
        }
        echo '</ol>';
      ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
