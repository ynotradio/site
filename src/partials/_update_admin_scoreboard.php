<?php
  require ("../functions/main_fns.php");
  require ("../functions/mrm_fns.php");
  open_db();

  if ($_SESSION["logged_in"]) {
    $current_match = now_match();
    admin_scoreboard($current_match); 
  } else {
    header('Location: ../madness.php');
  }
?>
