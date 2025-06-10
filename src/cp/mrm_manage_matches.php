<?php
$page_file = "mrm_manage_matches.php";
$page_title = "Modern Rock Madness Matches";

require ("../functions/main_fns.php");
require ("../controllers/MadnessController.php");
require ("../controllers/MadnessAdminController.php");
require ("../partials/_header.php");

// Initialize the admin controller
$db = open_db();
$adminController = new \YNotRadio\Controllers\MadnessAdminController($db);

$action = (empty($_POST['action'])) ? 'view' : $_POST['action'];

$round = (empty($_POST['round'])) ? 1 : $_POST['round'];
$round = (empty($_GET['round'])) ? $round : $_GET['round'];

$match = $_POST['match'];
$band = $_POST['band'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<script type='text/javascript'>
  // Initialize AdminMadness automatically when document is ready
</script>

<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Modern Rock Madness Matches</h1>
		<form action="mrm_manage_matches.php" method="get">
    <?php
      $current_match = $adminController->getCurrentMatch();
      if ($current_match) {
          $adminController->renderCountdown($current_match['id']);
      }
    ?>
		<center>Select a round:
			<select name="round" onchange="javascript:this.form.submit();">
      <?php
        $rounds = array();
			  for ($i=1; $i<=6; $i++) { array_push($rounds, $i); }
												
        foreach ($rounds as $roundvalue) {
          if ($roundvalue == $round)
            echo '<option value="'.$roundvalue.'" selected="'.$roundvalue.'"> Round '.$roundvalue.'</option>'. "\n";
          else
            echo '<option value="'.$roundvalue.'"> Round '.$roundvalue.'</option>'. "\n";
			} ?>
			</select>
		</center>
		<br>
			</form>
<?php 			
        echo "<div class=\"center\"><strong>Round " . $round . "</strong></div>";

	if ($action == "view") {
		$adminController->displayMatchesByRound($round);
	} elseif ($action == "write") {
		$adminController->vote($match, $band, true);
		$adminController->displayMatchesByRound($round);
	} elseif ($action == "close") {
		$adminController->closeMatch($match);
		$adminController->displayMatchesByRound($round);
	}

?>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
