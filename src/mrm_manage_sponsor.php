<?php

$page_file = "mrm_band_update.php";
$page_title = "Update Modern Rock Madness Sponsor";

require ("functions/main_fns.php");
require ("functions/mrm_fns.php");
require ("partials/_header.php");

$match = $_GET['match'];
$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Modern Rock Madness Sponsor</h1>
    <?php
      if (!$match) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action != "update"){
        $mrm_sponsor = get_mrm_sponsor($match);
        echo "<form action=\"mrm_sponsor_update.php?id=".$match."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
          require ("partials/_mrm_sponsor_form.php");
        echo "</form>";
      } else {
        $match = $_POST['match'];
        $sponsor = $_POST['sponsor'];
        $sponsor_msg = $_POST['sponsor_msg'];

        if (!$match || !$sponsor) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_mrm_sponsor($match, $sponsor, $sponsor_msg);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            echo "</div>";
          }
        }
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
