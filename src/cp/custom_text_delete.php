<?php

$page_file = "custom_text_delete.php";
$page_title = "Delete a Custom Text";

require ("../functions/main_fns.php");
require_once ("../models/CustomTextFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Custom Text</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        $db = open_db();
        $customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
        
        try {
          // Get the custom text before deletion for the success message
          $customText = $customTextModel->getById($id);
          
          $result = $customTextModel->delete($id);
          
          if ($result) {
            echo "<div class=\"center\"><h1>Success!</h1>".
                 "<h3>The custom text <span class=\"success\">". $customText['title'] ."</span> has been deleted.</h3></div>";
          } else {
            echo '<div class="top-spacer_20 center error">Error deleting the custom text</div>';
          }
        } catch (\Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="custom_text_view_all.php">View all Custom Texts</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
