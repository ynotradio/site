<?php

$page_file = "mrm_band_update.php";
$page_title = "Update Modern Rock Madness Band";

require ("../functions/main_fns.php");
require ("../models/ModernRockMadnessFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];
$action = $_POST['action'];

$db = open_db();
$mrmModel = \YNotRadio\Models\ModernRockMadnessFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Modern Rock Madness Band</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action != "update"){
        $mrm_band = $mrmModel->getBandById($id);
        echo "<form action=\"mrm_band_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
          require ("../partials/_mrm_band_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $name = $_POST['name'];
        $url = $_POST['url'];
        $pic_url = $_POST['pic_url'];
        $placement = $_POST['placement'];
        $seed = $_POST['seed'];
        $abbr = $_POST['abbr'];
        $sponsor = $_POST['sponsor'];

        if (!$name || !$url || !$pic_url || !$placement || !$seed || !$abbr || !$sponsor) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = $mrmModel->updateBand($id, $name, $url, $pic_url, $placement, $seed, $abbr, $sponsor);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
              echo $mrmModel->displayBand($mrmModel->getBandById($id));
            echo "</div>";
          }
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
