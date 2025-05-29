<?php

$page_file = "ad_add.php";
$page_title = "Add an Ad";

require ("../functions/main_fns.php");
require_once ("../models/AdFactory.php");
require ("../partials/_header.php");

$action = $_POST['action'];

$target = $_GET['target'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

$db = open_db();
$adModel = \YNotRadio\Models\AdFactory::create($db);
$ad = [];
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <?php if ($action != "insert") { ?>
    <h1>Add an Ad</h1>
    <form action="ad_add.php" method="post" class="form-internal inline input-seperation" id="admin">
    <?php require ("../partials/_ads_form.php"); ?>
    </form>
    <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
  <?php
    } else {
      $start_date = $_POST['start_date'];
      $end_date = $_POST['end_date'];
      $name = $_POST['name'];
      $pic_url = $_POST['pic_url'];
      $web_url = $_POST['web_url'];
      $priority = $_POST['priority'];

      if (!$start_date || !$end_date || !$name || !$pic_url || !$web_url || !$priority) {
        echo '<div class="top-spacer_20 center error">Error - missing requried value(s)</div>';
      } else {
        $data = [
          'name' => $name,
          'start_date' => $start_date,
          'end_date' => $end_date,
          'pic_url' => $pic_url,
          'web_url' => $web_url,
          'priority' => $priority
        ];
        try {
          $newId = $adModel->add($data);
          echo "<div class=\"center\"><h1>Success!</h1>".
               "<h3>New Ad for ". htmlspecialchars($name). " has been saved</h3>".
               "<hr width=75%>";
          $ad = $adModel->getById($newId);
          if ($ad) {
            echo "<pre>";
            print_r($ad);
            echo "</pre>";
          }
          echo "</div>";
        } catch (Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
      }
    }
?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Ad</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
