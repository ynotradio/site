<?php

$page_file = "pages.php";

require ("functions/main_fns.php");
require_once ("models/CustomTextFactory.php");
require ("partials/_header.php");

$page = $_GET['page'];
$db = open_db();
$customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
$custom_text = $customTextModel->findByPermalink($page);

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <?php 
      if ($custom_text['permalink'] == '') {
        echo "<h2 class=\"center\">Oh, No!
                <p>
                It seems that you have found a page that no longer is available.
                <p>
                <a href=\"contact\">Contact Us</a>
              </h2>";
      } else {
        echo "<h1>".$custom_text['title']."</h1>".
        $custom_text['html'];
      }
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
