<?php

$page_file = "yearendstaff.php";
$page_title = "Year End - Staff Picks";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/yearend_fns.php");
open_db();

/*----- CONTENT ------*/
?>

<div id="deejays">
<img src="images\yrendlong2012.png" alt="" width="660px" align="middle">
Check out the Y-Not DJs’ top songs and albums and then vote for yours in <a href="/yearendpoll.php">Y-Not Radio's 2012 Year End Poll!</a></p>
<?php
showyearendstaff();
?>
</div>
<div id="ads">
<?php
require("ads.php");
?>
</div>
<div style="clear:both;"></div>
<?php require ("ext/footer.php"); ?>
