<?php

$page_file = "year_end_staff_picks_update.php";
$page_title = "Update a Year End Staff Pick";

require ("../functions/main_fns.php");
require ("../models/YearEndStaffPickFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];
$db = open_db();
$staffPickModel = \YNotRadio\Models\YearEndStaffPickFactory::create($db);

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Year End Staff Pick</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        try {
          $year_end_staff_pick = $staffPickModel->getById($id);
          if (!$year_end_staff_pick) {
            echo '<div class="top-spacer_20 center error">Error - staff pick not found</div>';
          } else {
            echo "<form action=\"year_end_staff_picks_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
            require ("../partials/_year_end_staff_picks_form.php");
            echo "</form>";
          }
        } catch (\Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
        }
      } else {
        $order = $_POST['order'];
        $html = $_POST['html'];

        if (!$order || !$html) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          try {
            $staffPickData = [
              'order_id' => $order,
              'html' => $html
            ];
            
            if ($staffPickModel->update($id, $staffPickData)) {
              $updatedStaffPick = $staffPickModel->getById($id);
              echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
              echo "<b>Order:</b> ". $updatedStaffPick['order_id'] .
                   "<br><b>HTML:</b> ". $updatedStaffPick['html'];
              echo "</div>";
            }
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="year_end_staff_picks_view_all.php">View all Year End Staff Picks</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
