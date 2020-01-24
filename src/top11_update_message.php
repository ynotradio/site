<?php

$page_file = "top11_update_message.php";
$page_title = "Update Top 11 @ 11 Message";

require ("functions/main_fns.php");
require ("functions/top11_fns.php");
require ("functions/featured_concert_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update Top 11 @ 11 Message</h1>
    <?php
      if ($action == "update") {
        update_top11_message($_POST['message']);
        echo "<div class=\"center success sample-below\">Top 11 @ 11 message has been saved!</div>
          <em>This is now live on the site:</em>
          <div class=\"row\">
          <div class=\"nine columns\">
            <h1>Top 11 @ 11</h1>";
            display_top11_message();
            echo "</div>
            <div class=\"three columns\">";
              display_featured_concerts(1);
            echo "</div>
            </div>
            <a href=\"top11_update_message.php\">Update Top 11 @ 11 Message</a>
            <p>";
      } else {
      $top11_message = mysqli_fetch_assoc(get_top11_message());
    ?>
    <form action="top11_update_message.php" method="post" class="form-internal inline" id="admin">
      <textarea name="message" cols=90 rows=10><?php echo $top11_message["message"] ?></textarea>
      <p>
      <input type="hidden" name="action" value="update">
      <input type="submit" value="Update Top 11 Message" class="btn-info">
    </form>
    <?php } ?>
    <a href="cp.php">Control Panel</a>
  </div>
</div> <!-- end of row div -->
<?php
  }
  require ("partials/_footer.php");
?>
