<?php
  require ("../functions/main_fns.php");
  require ("../functions/mrm_fns.php");
  open_db();

  $current_match = now_match();

  scoreboard($current_match); 
?>
