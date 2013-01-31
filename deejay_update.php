<?php

$page_file = "deejay_update.php";
$page_title = "Update Deejay";

require ("functions/main_fns.php");
require ("functions/deejay_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update Deejay</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update"){
        $deejay = get_deejay ($id);
        echo "<form action=\"deejay_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_deejay_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $name = $_POST['name'];
        $show = $_POST['show'];
        $email = $_POST['email'];
        $external_connect_text = $_POST['external_connect_text'];
        $external_connect_url = $_POST['external_connect_url'];
        $pic = $_POST['pic'];

        if (!$name || !$email) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_deejay($id, $name, $show, $email, $external_connect_text, $external_connect_url, $pic);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_deejay(get_deejay($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="deejay_view_all.php">Back to all Deejays</a>
      <p>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
