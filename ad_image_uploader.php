<?php

$page_file = "ad_image_uploader.php";
$page_title = "Ad Image Uploader";

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
    <form enctype="multipart/form-data" action="uploader.php" method="post" class="form-internal inline input-seperation" id="admin">
      <div class="control-group center">
        <div class="control"><input name="uploadedfile" type="file"></div>
      </div>
      <div class="center">
        <input type="hidden" name="MAX_FILE_SIZE" value="250000">
        <input type="hidden" value="ads" name="directory">
        <input type="submit" value="Upload Image" class="btn-success">
      </div>
    </form>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
