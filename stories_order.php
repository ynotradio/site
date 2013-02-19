<?php

$page_file = "stories_order.php";
$page_title = "Order the Stories";

require ("functions/main_fns.php");
require ("functions/story_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Current order of Stories</h1>
      <?php 
        if ($action == 'order') {
          foreach ($_POST as $id=>$order) { 
            if ($id != 'action') 
              save_order($id, $order);
          }
        }
        current_order();
      ?>
    <div class="top-spacer_20">
      <a href="story_view_all.php">View all Stories</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
