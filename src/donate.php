<?php

$page_file = "donate.php";
$page_title = "Donate";

require ("functions/main_fns.php");
require_once ("models/CustomTextFactory.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <?php
      $db = open_db();
      $customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
      $custom_text = $customTextModel->findByPermalink('donate');
      echo "<h1>".$custom_text['title']."</h1>" .
      $custom_text['html'];
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
