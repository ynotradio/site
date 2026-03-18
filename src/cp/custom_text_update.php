<?php

$page_file = "custom_text_update.php";
$page_title = "Update Custom Text";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require_once ("../models/CustomTextFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Custom Text</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $db = open_db();
        $customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
        $custom_text = $customTextModel->getById($id);
        
        echo "<form action=\"custom_text_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("../partials/_custom_text_form.php");
        echo "</form>";
      } else {
        $title = $_POST['title'];
        $html = $_POST['html'];

        if (!$title || !$html) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $db = open_db();
          $customTextModel = \YNotRadio\Models\CustomTextFactory::create($db);
          
          try {
            $data = [
              'title' => $title,
              'html' => $html
            ];
            $result = $customTextModel->update($id, $data);
            
            if ($result) {
              echo '<div class="top-spacer_20"><h1 class="center">Update was successful!</h1>';
              $customText = $customTextModel->getById($id);
              echo "<b>Title:</b> ". $customText['title'].
                   "<br><b>Permalink:</b> ". $customText['permalink'].
                   "<br><b>Url:</b> <a href=\"../pages.php?page=".$customText['permalink']."\" target=\"_new\">http://www.ynotradio.net/pages.php?page=".$customText['permalink']."</a>".
                   "<br><b>Copy:</b><br>". $customText['html'];
              echo "</div>";
            }
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="custom_text_view_all.php">View all Custom Texts</a>
      <p>
      <?php $payload_edit_url = $id ? get_payload_edit_url('posts', 'posts', (int) $id + 10000) : null; ?>
      <?php if ($payload_edit_url): ?>
        <a href="<?php echo htmlspecialchars($payload_edit_url); ?>" target="_blank">Edit in Payload ↗</a>
        <p>
      <?php endif; ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
