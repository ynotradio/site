<?php

$page_file = "loggedoff.php";
$page_title = "Logged Off";

require ("functions/main_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content ">
    <h1 class="center success">You have successfully logged off</h1>
    <a href="cp.php">Enter the control panel</a>
  </div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
