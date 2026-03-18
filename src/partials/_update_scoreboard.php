<?php
  require ("../functions/main_fns.php");
  require ("../controllers/MadnessController.php");
  
  $db = open_db();
  $controller = new \YNotRadio\Controllers\MadnessController($db);

  $current_match = $controller->getCurrentMatch();
  if (!$current_match) {
    return;
  }

  $controller->renderScoreboard($current_match); 
?>
