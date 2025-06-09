<?php
  require ("../functions/main_fns.php");
  require ("../controllers/MadnessController.php");
  require ("../controllers/MadnessAdminController.php");
  
  $db = open_db();
  $controller = new \YNotRadio\Controllers\MadnessController($db);
  $adminController = new \YNotRadio\Controllers\MadnessAdminController($db);

  $current_match = $adminController->getCurrentMatch();

  $controller->renderScoreboard($current_match); 
?>
