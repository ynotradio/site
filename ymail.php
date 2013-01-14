<?php

$page_file = "ymail.php";
$page_title = "Y-Mail";

require ("ext/main_fns.php");
require ("ext/header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1></h1>
    <h1>Y-Mail</h1>
    Sign up for Y-Not Radio's weekly e-mail newsletter, or Y-Mail as we like to call it. Then you'll have all of our programming information as well as news on upcoming concerts, album reviews, ticket giveaways, and more delivered right to you.
    <iframe id="iframeform" src="https://secure.campaigner.com/CSB/Public/Form.aspx?fid=642965" height="320" width="560" scrolling="no" frameborder="0">If you can see this, your browser does not support IFRAME.  Please use supported browser</iframe>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>

