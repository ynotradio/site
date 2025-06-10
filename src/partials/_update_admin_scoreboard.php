<?php
  // Use absolute paths
  $root_path = $_SERVER['DOCUMENT_ROOT'];
  require_once($root_path . "/functions/main_fns.php");
  require_once($root_path . "/controllers/MadnessController.php");
  require_once($root_path . "/controllers/MadnessAdminController.php");
  
  // Open database connection
  $db = open_db();
  $adminController = new \YNotRadio\Controllers\MadnessAdminController($db);
  
  // For AJAX calls, we'll process even if not logged in
  // since this is just displaying votes and not modifying anything
  
  // If specific match_id is provided, use that match
  if (isset($_POST['match_id']) && is_numeric($_POST['match_id'])) {
    $match_id = intval($_POST['match_id']);
    $match = $adminController->getMatch($match_id);
    if ($match) {
      echo $adminController->renderAdminScoreboard($match);
    } else {
      echo "<!-- Invalid match ID -->";
    }
  } else {
    // Otherwise use current match
    $current_match = $adminController->getCurrentMatch();
    if ($current_match && $current_match['id'] != '8888') {
      echo $adminController->renderAdminScoreboard($current_match);
    } else {
      echo "<!-- No current match -->";
    }
  }
?>
