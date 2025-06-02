<?php

$page_file = "custom_text_view_all.php";
$page_title = "View All Custom Texts";

require ("../functions/main_fns.php");
require_once ("../models/CustomTextFactory.php");
require ("../partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Custom Texts</h1>
      <?php 
        $db = open_db();
        $customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
        $customTexts = $customTextModel->getAll();
        
        echo '<ol>';
        foreach ($customTexts as $customText) {
          echo "<b>Title:</b> ". $customText['title'] .
               "<br><b>Permalink:</b> " . $customText['permalink'] .
               '<br>[ <a href="custom_text_update.php?id=' .$customText['id']. '">Edit</a> | <a href="custom_text_delete.php?id=' .$customText['id']. '">Delete</a> ] <p>';
        }
        echo '</ol>';
      ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
