<?php

$page_file = "top11_update.php";
$page_title = "Update Top 11 @ 11";

require ("functions/main_fns.php");
require ("functions/top11_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update Top 11 @ 11</h1>
    <?php
      if ($action == "insert") {
        $count = 1;
        $placement = 1;
        foreach ($_POST as $key=>$val) {
          if ($key == 'date') {
            update_top11_date($val);
          } else {
            if ($count == 1)
              $artist = $val;
            if ($count == 2)
              $song = $val;
            if ($count == 3) {
              $count = 0;
              update_top11(($placement/3), $artist, $song, $val);
            }
            $count++;
            $placement ++;
          }
        }
      echo "<div class=\"center success\">Top 11 @ 11 has been saved!</div>";
      show_top11();
      echo "<a href=\"top11_update.php\">Update Top 11 @ 11</a>
        <p>";
      } else {
      $top11 = get_top11();
    ?>
    <form action="top11_update.php" method="post" class="form-internal inline" id="admin">
    <?php require ("partials/_top11_form.php"); ?>
    </form>
    <?php } ?>
    <a href="cp.php">Back to the control panel</a>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
