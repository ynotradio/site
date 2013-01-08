<?php

$page_file = "";
$page_title = "";

require ("ext/main_fns.php");
require ("ext/header.php");
//require ("/ext/story_fns.php");
open_db();


/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns">
    <div class="row">
      <div class="six columns">six columns</div>
      <div class="six columns">six columns</div>
    </div>
  </div>
  <div class="three columns">Ads go here!</div>
</div> <!-- end of row div -->
<div style="clear:both;"></div>
<?php require ("ext/footer.php"); ?>
