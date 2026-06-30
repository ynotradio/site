<?php

$page_file = "custom_text_add.php";
$page_title = "Add a Custom Text";

require ("../functions/main_fns.php");
require_once ("../models/CustomTextFactory.php");
require ("../partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Custom Text</h1>
      <?php if ($action != "insert") { ?>
      <form action="custom_text_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("../partials/_custom_text_form.php"); ?>
      </form>
    <?php
      } else {
        $title = $_POST['title'];
        $html = $_POST['html'];

        if (!$title || !$html)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else {
          $db = open_db();
          $customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
          
          try {
            $data = [
              'title' => $title,
              'html' => $html
            ];
            $newId = $customTextModel->add($data);
            
            echo "<div class=\"center\"><h1>Success!</h1>".
                 "<h3>New Custom Text has been saved</h3>".
                 "<hr width=75%>";
            
            $customText = $customTextModel->getById($newId);
            echo "<b>Title:</b> ". $customText['title'].
                 "<br><b>Permalink:</b> ". $customText['permalink'].
                 "<br><b>Url:</b> <a href=\"../pages.php?page=".$customText['permalink']."\" target=\"_new\">http://www.ynotradio.net/pages.php?page=".$customText['permalink']."</a>".
                 "<br><b>Copy:</b><br>". $customText['html'];
            echo "</div>";
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Custom Text</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
