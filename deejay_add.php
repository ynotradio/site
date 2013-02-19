<?php

$page_file = "deejay_add.php";
$page_title = "Add a Deejay";

require ("functions/main_fns.php");
require ("functions/deejay_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Deejay</h1>
      <?php if ($action != "insert") { ?>
      <form action="deejay_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_deejay_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $name = $_POST['name'];
        $show = $_POST['show'];
        $email = $_POST['email'];
        $external_connect_text = $_POST['external_connect_text'];
        $external_connect_url = $_POST['external_connect_url'];
        $pic = $_POST['pic'];

        if (!$name || !$email)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_deejay($name, $show, $email, $external_connect_text, $external_connect_url, $pic);
      }
    ?>
    <div class="top-spacer_20">
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
