<?php
                               
$page_file = "image_uploader.php";
$page_title = "Image Uploader";

require ("ext/main_fns.php");
require ("ext/header.php");
	
if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center>
<form enctype="multipart/form-data" action="uploader.php" method="POST">
<input type="hidden" name="MAX_FILE_SIZE" value="250000" />
<p>
<h2>Upload an Image:</h2>
<p><input name="uploadedfile" type="file" />
<p>
<p>
<input type="submit" value="Upload Image" />
</form>
</center>
</div>
<?php
}
require("ext/footer.php");
?>