<?php

$page_file = "logoff.php";
$page_title = "Logoff";

require ("ext/main_fns.php");
require ("ext/header.php");

//if (!$_SESSION["logged_in"]) {
//  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
//} else {
  logoff();
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content ">
    <h1 class="center success">You have successfully logged off</h1>
    <a href="cp.php">Enter the control panel</a>
  </div>
</div> <!-- end of row div -->
<?php
//  } 
  require ("ext/footer.php"); 
?>
