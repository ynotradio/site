<?php

$page_file = "top11_vote_add.php";
$page_title = "Add Top 11 Vote";

require ("../functions/main_fns.php");
require_once ("../models/Top11Factory.php");
require ("../partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add Top 11 Vote</h1>
    <?php
      if ($_POST['action']) {
        $by_pass_ip_check = true; // Flag for the save file
        require ("../partials/_top11_save.php");
      } else {
        // Display the voting form
        $songs = $top11Model->getAllSongs();
        echo "<h2 class=\"center\">Vote for Your Top 3 Y-Not Songs of the Week</h2>\n";
        echo "<form action=".$page_file." method=\"post\" name=\"top11\" class=\"form-default\">
          <fieldset>\n<div class=\"control-group\">\n<div class=\"controls\">\n";
        
        foreach ($songs as $song) {
          echo "<label for=\"".$song['id']."\" class=\"half\"><input type=\"checkbox\" name=\"top11[]\" id=\"".$song['id']."\" value=\"".$song['id']."\">".
            "<span class=\"top11_entry\"> " . $song['artist'] ." - ".$song['song'] ."\n</span>\n</label>\n";
        }
        
        echo "</div></div>\n<div class=\"control-group\">\n<div class=\"controls\">\n";
        echo "<input type=\"checkbox\" id=\"top11_write_in\"> <input type=\"text\" disabled=\"disabled\" class=\"input-xl\" id=\"write_in_value\" name=\"write_in_value\">\n".
          "<div class=\"form-other\">Other (please specify)</div>\n</div>\n</div>\n";
      
        echo "<div class=\"control-group top-spacer_20 input-seperation\">\n".
          "<label>First Name</label>\n<div class=\"controls\">\n<input type=\"text\" name=\"firstname\" class=\"input-l\"></div>\n".
          "<label>Last Name</label>\n<div class=\"controls\">\n<input type=\"text\" name=\"lastname\" class=\"input-l\"/></div>\n".
          "<label>E-mail</label>\n<div class=\"controls\"><input type=\"text\" name=\"email\" class=\"input-l\"/></div>\n".
          "<label>Phone Number</label>\n<div class=\"controls\"><input type=\"text\" name=\"phone\" class=\"input-l\"/></div>\n".
          "<label>Would you like to be entered into this week's contest?</label>\n".
          "<div class=\"controls inline clearfix\"><label for=\"yes\"><input type=\"radio\" name=\"contest\" id=\"yes\" value=\"yes\" checked />Yes</label>".
          "<label for=\"no\"><input type=\"radio\" name=\"contest\" id=\"no\" value=\"no\" />No</label></div>\n".
          "<label>Would you like to receive Y-Not Radio's weekly Y-Mail newsletter?</label>\n".
          "<div class=\"controls inline clearfix\"><label for=\"newsletter-yes\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-yes\" value=\"yes\" checked />Yes</label>".
          "<label for=\"newsletter-no\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-no\" value=\"no\" />No</label>".
          "<label for=\"newsletter-already\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-already\" value=\"already\" />I Already Receive It</label></div>\n".
          "<div class=\"form-actions\"><button class=\"btn-info\" type=\"submit\">Cast Your Vote</button>\n" .
          "<input type=\"hidden\" name=\"action\" value=\"write\"></div>".
          "</form>\n</div>\n</fieldset>";
      }
    ?>
    <div class="top-spacer_20">
      <a href="top11_vote_add.php">Add another Top 11 Vote</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php require ("../partials/_footer.php"); ?>
