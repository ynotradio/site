<?php
  // Use absolute paths
  $root_path = $_SERVER['DOCUMENT_ROOT'];
  require_once($root_path . "/functions/main_fns.php");
  require_once($root_path . "/functions/mrm_fns.php");
  
  // Open database connection
  @open_db();
  
  // For AJAX calls, we'll process even if not logged in
  // since this is just displaying votes and not modifying anything
  
  // If specific match_id is provided, use that match
  if (isset($_POST['match_id']) && is_numeric($_POST['match_id'])) {
    $match_id = intval($_POST['match_id']);
    $match = get_match($match_id);
    if ($match) {
      admin_scoreboard($match);
    } else {
      echo "<!-- Invalid match ID -->";
    }
  } else {
    // Otherwise use current match
    $current_match = now_match();
    if ($current_match && $current_match['id'] != '8888') {
      admin_scoreboard($current_match);
    } else {
      echo "<!-- No current match -->";
    }
  }
?>
