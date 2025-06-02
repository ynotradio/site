<?php

$page_file = "y100rocks.php";
$page_title = "Y100Rocks";

require ("functions/main_fns.php");
require_once ("models/CustomTextFactory.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content">
	<?php
	$db = open_db();
    $customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
	$custom_text = $customTextModel->findByPermalink("y100-rocks");
	echo "<h1>" . $custom_text['title'] . "</h1>";
	echo $custom_text['html'];
	?>
  </div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
