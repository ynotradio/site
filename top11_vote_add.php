<?php

$page_file = "top11_vote_add.php";
$page_title = "Add Top 11 Vote";

require ("functions/main_fns.php");
require ("functions/top11_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add Top 11 Vote</h1>
    <?php
      if ($_POST['action']) {
        $by_pass_ip_check = true;
        require ("partials/_top11_save.php");
       } else
        display_form($page_file);
    ?>
    <div class="top-spacer_20">
      <a href="top11_vote_add.php">Add another Top 11 Vote</a>
      <p>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
