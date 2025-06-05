<?php

$page_file = "mrm_band_delete.php";
$page_title = "Delete a Modern Rock Madness Band";

require ("../functions/main_fns.php");
require ("../models/ModernRockMadnessFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];

$db = open_db();
$mrmModel = \YNotRadio\Models\ModernRockMadnessFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Modern Rock Madness</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        $band = $mrmModel->getBandById($id);
        $result = $mrmModel->deleteBand($id);
        if ($result) {
          echo "<div class=\"center\"><h1>Success!</h1>" .
            "<h3>The band <span class=\"success\">" . $band['name'] . "</span> has been deleted.</h3></div>";
        } else {
          echo '<div class="top-spacer_20 center error">Error deleting the band from the database</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="mrm_view_all.php">View all Modern Rock Madness Bands</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>

