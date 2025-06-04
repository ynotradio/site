<?php

$page_file = "top11_update.php";
$page_title = "Update Top 11 @ 11";

require ("../functions/main_fns.php");
require_once ("../models/Top11Factory.php");
require ("../partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update Top 11 @ 11</h1>
    <?php
      if ($action == "insert") {
        try {
          $count = 1;
          $placement = 1;
          foreach ($_POST as $key=>$val) {
            if ($key == 'date') {
              $top11Model->updateDate($val);
            } else {
              if ($count == 1)
                $artist = $val;
              if ($count == 2)
                $song = $val;
              if ($count == 3) {
                $count = 0;
                $top11Model->update(($placement/3), $artist, $song, $val);
              }
              $count++;
              $placement ++;
            }
          }
          echo "<div class=\"center success\">Top 11 @ 11 has been saved!</div>";
          
          // Show the updated Top11
          $top11Entries = $top11Model->getAll();
          $titleEntry = null;
          
          foreach ($top11Entries as $entry) {
              if ($entry['placement'] == 99) {
                  $titleEntry = $entry;
                  break;
              }
          }
          
          echo "<h2 class=\"center\">Top 11 @ 11 for ". $titleEntry['artist']. "</h2>\n";
          echo "<table class='table table-striped table-bordered-horizontal table-condensed no-header table-center'>";
          
          foreach ($top11Entries as $entry) {
              if ($entry['placement'] != 99 && $entry['placement'] != 98) {
                  echo "<tr>\n<td>" . $entry['placement'] . " </td>\n" .
                      "<td>" . $entry['artist'] . "</td>\n" .
                      "<td>" . $entry['song'] . "</td>\n" .
                      "<td>" . $entry['note'] . "</td>\n" .
                      "</tr>\n";
              }
          }
          echo "</table>\n";
          
          echo "<a href=\"top11_update.php\">Update Top 11 @ 11</a>
            <p>";
        } catch (\Exception $e) {
          echo "<div class=\"center error\">Error: " . $e->getMessage() . "</div>";
        }
      } else {
        $top11 = $top11Model->getAll();
    ?>
    <form action="top11_update.php" method="post" class="form-internal inline" id="admin">
    <?php require ("../partials/_top11_form.php"); ?>
    </form>
    <?php } ?>
    <a href="index.php">Control Panel</a>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
