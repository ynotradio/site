<?php

$page_file = "year_end_staff_picks_add.php";
$page_title = "Add a Year End Staff Pick";

require ("../functions/main_fns.php");
require ("../models/YearEndStaffPickFactory.php");
require ("../partials/_header.php");

$action = $_POST['action'];
$target = $_GET['target'];
$db = open_db();
$staffPickModel = \YNotRadio\Models\YearEndStaffPickFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <?php if ($action != "insert") { ?>
    <h1>Add a Year End Staff Pick</h1>
    <form action="year_end_staff_picks_add.php" method="post" class="form-internal inline input-seperation" id="admin">
    <?php 
    // Initialize empty year_end_staff_pick for the form
    $year_end_staff_pick = [
      'html' => '',
      'order_id' => $staffPickModel->getCount() + 1
    ];
    require ("../partials/_year_end_staff_picks_form.php"); 
    ?>
    </form>
  <?php
    } else {
      $order = $_POST['order'];
      $html = $_POST['html'];

      if (!$order || !$html) {
        echo '<div class="top-spacer_20 center error">Error - missing requried value(s)</div>';
      } else {
        try {
          $staffPickData = [
            'order_id' => $order,
            'html' => $html
          ];
          
          $newId = $staffPickModel->add($staffPickData);
          $newStaffPick = $staffPickModel->getById($newId);
          
          echo "<div class=\"center\"><h1>Success!</h1>".
               "<h3>New Year End Staff Pick has been saved</h3>".
               "<hr width=75%>";
          
          echo "<b>Order:</b> ". $newStaffPick['order_id'] .
               "<br><b>HTML:</b> ". $newStaffPick['html'];
          
          echo "</div>";
        } catch (\Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
        }
      }
    }
?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Year End Staff Pick</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>

