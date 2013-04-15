<?php

$page_file = "recordstoreday.php";
$page_title = "Record Store Day";

require ("functions/main_fns.php");
require ("functions/custom_text_fns.php");
require ("partials/_header.php");


/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <?php
      $custom_text = find_custom_text_by_permalink('record-store-day');
      echo "<h1>".$custom_text['title']."</h1>" .
      $custom_text['html'];
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
