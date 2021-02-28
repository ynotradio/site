<?php

$page_file = "ymail.php";
$page_title = "Y-Mail";

require "functions/main_fns.php";
require "partials/_header.php";

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
  	<iframe class="mj-w-res-iframe" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://app.mailjet.com/widget/iframe/6cdM/Hx4" width="100%"></iframe>
	<script type="text/javascript" src="https://app.mailjet.com/statics/js/iframeResizer.min.js"></script>
  </div>

  <div class="three columns"><?php require "partials/_featured_concerts_and_ads.php" ?></div>
</div> <!-- end of row div -->
<?php require "partials/_footer.php"; ?>
