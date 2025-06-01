<?php

$page_file = "deejay_delete.php";
$page_title = "Delete a Deejay";

require ("../functions/main_fns.php");
require_once ("../models/DeejayFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Deejay</h1>
    <?php
      try {
        $db = open_db();
        $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
        
        if (!$id) {
          echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
        } else {
          $deejay = $deejayModel->getById($id);
          if ($deejay) {
            $success = $deejayModel->delete($id);
            if ($success) {
              echo "<div class=\"center\"><h1>Success!</h1>".
              "<h3>The deejay <span class=\"success\">". $deejay['name'] ."</span> has been deleted.</h3></div>";
            } else {
              echo '<div class="top-spacer_20 center error">Failed to delete the deejay</div>';
            }
          } else {
            echo '<div class="top-spacer_20 center error">Deejay not found</div>';
          }
        }
      } catch (\Exception $e) {
        echo '<div class="top-spacer_20 center error">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
      }
    ?>
    <div class="top-spacer_20">
      <a href="deejay_view_all.php">View all Deejays</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
