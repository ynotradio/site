<?php

$page_file = "year_end_staff_picks_add.php";
$page_title = "Add a Year End Staff Picks";

require ("functions/main_fns.php");
require ("functions/year_end_staff_pick_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];
$target = $_GET['target'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <?php if ($action != "insert") { ?>
    <h1>Add a Year End Staff Picks</h1>
    <form action="year_end_staff_picks_add.php" method="post" class="form-internal inline input-seperation" id="admin">
    <?php require ("partials/_year_end_staff_picks_form.php"); ?>
    </form>
  <?php
    } else {
      $order = $_POST['order'];
      $html = $_POST['html'];

      if (!$order || !$html) {
        echo '<div class="top-spacer_20 center error">Error - missing requried value(s)</div>';
      } else {
        add_year_end_staff_pick($order, $html);
      }
    }
?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Year End Staff Pick</a>\n<p>";
      ?>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>

