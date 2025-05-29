<?php

$page_file = "ads_order.php";
$page_title = "Order the Ads";

require ("../functions/main_fns.php");
require_once ("../models/AdFactory.php");
require ("../partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

$db = open_db();
$adModel = \YNotRadio\Models\AdFactory::create($db);
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Current order of Ads</h1>
      <?php 
        if ($action == 'order') {
          foreach ($_POST as $id=>$order) { 
            if ($id != 'action') 
              $adModel->updateOrder($id, $order);
          }
          echo '<h1 class="top-spacer_20 center success">Ordering Ads were successful!</h1>';
        }
        // Render the form with current ads
        $ads = $adModel->getCurrent();
        echo '<form action="ads_order.php" method="post">';
        foreach ($ads as $info) {
          echo "<div class=\"bottom-spacer_20\">
            Name: <b>" . htmlspecialchars($info['name']). "</b>
            <br>
            Priority: <input type=\"text\" class= \"input-xs\" value=\"".htmlspecialchars($info['priority'])."\" name=\"".htmlspecialchars($info['id'])."\">
            </div>";
        }
        echo "<input type=\"hidden\" name=\"action\" value=\"order\">
          <input type=\"submit\" class=\"btn-inverse\" value=\"Update Stories\">
          </form>";
      ?>
    <div class="top-spacer_20">
      <a href="ad_view_all_active.php">View all Ads</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
