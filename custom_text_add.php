<?php

$page_file = "custom_text_add.php";
$page_title = "Add a Custom Text";

require ("functions/main_fns.php");
require ("functions/custom_text_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Custom Text</h1>
      <?php if ($action != "insert") { ?>
      <form action="custom_text_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_custom_text_form.php"); ?>
      </form>
    <?php
      } else {
        $title = $_POST['title'];
        $html = $_POST['html'];

        if (!$title || !$html)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_custom_text($title, $html);
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Custom Text</a>\n<p>";
      ?>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
