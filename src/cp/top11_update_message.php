<?php

$page_file = "top11_update_message.php";
$page_title = "Update Top 11 @ 11 Message";

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
    <h1>Update Top 11 @ 11 Message</h1>
    <?php
      if ($action == "update") {
        try {
          $top11Model->updateMessage($_POST['message']);
          $updatedMessage = $top11Model->getMessage();
          
          echo "<div class=\"center success sample-below\">Top 11 @ 11 message has been saved!</div>
            <em>This is now live on the site:</em>
            <div class=\"row\">
            <div class=\"nine columns\">
              <h1>Top 11 @ 11</h1>
              <div class=\"top11-message full_height\">
                <img src=\"../imgs/knob_11.jpg\" alt=\"Top 11\" /></td>
                <td id=\"top11message\">" . $updatedMessage['message'] . "
              </div>";
          echo "</div>
            <div class=\"three columns\">";
              require_once "../partials/_featured_concerts_and_ads.php";
            echo "</div>
            </div>
            <a href=\"top11_update_message.php\">Update Top 11 @ 11 Message</a>
            <p>";
        } catch (\Exception $e) {
          echo "<div class=\"center error\">Error: " . $e->getMessage() . "</div>";
        }
      } else {
        $top11_message = $top11Model->getMessage();
    ?>
    <form action="top11_update_message.php" method="post" class="form-internal inline" id="admin">
      <textarea name="message" cols=90 rows=10><?php echo $top11_message["message"] ?></textarea>
      <p>
      <input type="hidden" name="action" value="update">
      <input type="submit" value="Update Top 11 Message" class="btn-info">
    </form>
    <?php } ?>
    <a href="index.php">Control Panel</a>
  </div>
</div> <!-- end of row div -->
<?php
  }
  require ("../partials/_footer.php");
?>
