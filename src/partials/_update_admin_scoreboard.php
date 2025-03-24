<?php
  // Use absolute paths since this can be called directly from AJAX
  $path = $_SERVER['DOCUMENT_ROOT'];
  require_once($path . "/functions/main_fns.php");
  require_once($path . "/functions/mrm_fns.php");
  open_db();

  if ($_SESSION["logged_in"]) {
    // If specific match_id is provided, use that match
    if (isset($_POST['match_id']) && is_numeric($_POST['match_id'])) {
      $match_id = $_POST['match_id'];
      $match = get_match($match_id);
      admin_scoreboard($match);
    } else {
      // Otherwise use current match
      $current_match = now_match();
      admin_scoreboard($current_match);
    }
  } else {
    echo "<!-- Not logged in -->";
  }
?>
