<?php

$page_file = "dontate.php";
$page_title = "Donate";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/custom_text_fns.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1></h1>
    <h1>Donate to Y-Not Radio</h1>
    <p>
    <?php display_custom_text(1); ?>
    <p>
    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" class="center">
      <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
      <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
      <input type="hidden" name="cmd" value="_s-xclick">
      <input type="hidden" name="hosted_button_id" value="NSC3MPELFXKUJ">
    </form>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
