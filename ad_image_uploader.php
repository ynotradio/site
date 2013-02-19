<?php

$page_file = "ad_image_uploader.php";
$page_title = "Ad Image Uploader";
$upload_type = "ads";

require ("functions/main_fns.php");
require ("partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Upload an Ad Image</h1>
      <?php require ("partials/_image_upload_form.php"); ?>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
