<?php

$page_file = "y100rocks.php";
$page_title = "Y100Rocks";

require ("functions/main_fns.php");
require ("functions/custom_text_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content">
	<?php
	$custom_text = find_custom_text_by_permalink("y100-rocks");
	echo "<h1>" . $custom_text['title'] . "</h1>";
	echo $custom_text['html'];
	?>
  </div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
