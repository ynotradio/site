<?php

$page_file = "ads_order.php";
$page_title = "Order the Ads";

require ("functions/main_fns.php");
require ("functions/ads_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Current order of Ads</h1>
      <?php 
        if ($action == 'order') {
          foreach ($_POST as $id=>$order) { 
            if ($id != 'action') 
              save_ad_order($id, $order);
          }
          echo '<h1 class="top-spacer_20 center success">Ordering Ads were successful!</h1>';
        }
        current_ads_order();
      ?>
    <div class="top-spacer_20">
      <a href="ad_view_all_active.php">View all Ads</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
