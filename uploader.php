<?php

$page_file = "uploader.php";
$page_title = "Image Uploader";

require ("functions/main_fns.php");
require ("functions/image_fns.php");
require ("partials/_header.php");

$target_path = "images/";
$ads = $_POST['directory'];

if ($ads == 'ads')
  $target_path = "sponsors/";
	
if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Image Uploader</h1>
    <?php
      $file = str_replace(' ', '_', $_FILES['uploaded_file']['name']);
      $file = strtolower($file);

      $target_path = $target_path . $file;

      if(move_uploaded_file($_FILES['uploaded_file']['tmp_name'], $target_path)) {
          echo "<div class=\"center\"><h3>The file ".  $file . " has been uploaded</h3>";
        echo "<img src=\"".$target_path."\" width=\"218px\">
            <h3>You can use this file: ".$target_path . "</h3>
                </div>";

        if ($ads != 'ads')
          add_image($file);
        else
          echo '<div class="top-spacer_20"><a href="ad_add.php?target='.$target_path.'">Add this image to a new ad</a></div>';

      } else {
        echo "<div class=\"center error\">There was an error uploading the file, please try again!</div>";
      }
      if ($ads == 'ads')
        echo "<a href=\"ad_image_uploader.php\">Upload another ad image</a>";
    ?>
    <p>
    <a href="cp.php">Control Panel</a>
  </div>
</div>
<?php
}
require("partials/_footer.php");
?>
