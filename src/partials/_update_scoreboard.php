<?php
  require ("../functions/main_fns.php");
  require ("../models/ModernRockMadnessFactory.php");
  
  $db = open_db();
  $mrmModel = \YNotRadio\Models\ModernRockMadnessFactory::create($db);

  $current_match = $mrmModel->getCurrentMatch();

  echo $mrmModel->scoreboard($current_match); 
?>
