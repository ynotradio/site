<?php

$page_file = "donate.php";
$page_title = "Donate";

require ("functions/main_fns.php");
require ("functions/custom_text_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <?php
      $custom_text = find_custom_text_by_permalink('donate');
      echo "<h1>".$custom_text['title']."</h1>" .
      $custom_text['html'];
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
