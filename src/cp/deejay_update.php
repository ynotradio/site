<?php

$page_file = "deejay_update.php";
$page_title = "Update Deejay";

require ("../functions/main_fns.php");
require_once ("../models/DeejayFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

// Function moved from deejay_fns.php
function display_deejay($deejay) {
  echo "<div class='sort-item' id='item-" . $deejay['id'] . "'>". 
  "<div class='handle'></div>" . 
  "<b>Name:</b> ". $deejay['name'].
  "<br><b>Show:</b> ". $deejay['show'].
  "<br><b>Email:</b> ". $deejay['email'].
  "<br><b>External Connect Text:</b> ". $deejay['external_connect_text'].
  "<br><b>External Connect URL:</b> ". $deejay['external_connect_url'];
  if ($deejay['pic'] != "") {
    echo "<br><b>Deejay Picture:</b><br><img src=\"". $deejay['pic']. "\" height='150px';>\n";
  } else {
    echo "<br><b>Deejay Picture:</b><br> <img src=\"/imgs/na.jpg\" height='100px';>\n";
  }

  echo '<br>[ <a href="deejay_update.php?id=' .$deejay['id']. '">Edit</a> | <a href="deejay_delete.php?id=' .$deejay['id']. '">Delete</a> ] <p>';
  echo '</div>';
}

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Deejay</h1>
    <?php
      try {
        $db = open_db();
        $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
        
        if (!$id) {
          echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
        } elseif ($action == "update"){
          $deejay = $deejayModel->getById($id);
          if ($deejay) {
            echo "<form action=\"deejay_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
            require ("../partials/_deejay_form.php");
            echo "</form>
            <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
          } else {
            echo '<div class="top-spacer_20 center error">Deejay not found</div>';
          }
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
            $data = [
              'name' => $name,
              'show' => $show,
              'email' => $email,
              'external_connect_text' => $external_connect_text,
              'external_connect_url' => $external_connect_url,
              'pic' => $pic
            ];
            
            $result = $deejayModel->update($id, $data);
            if ($result) {
              $deejay = $deejayModel->getById($id);
              echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
              display_deejay($deejay);
              echo "</div>";
            } else {
              echo '<div class="top-spacer_20 center error">Failed to update deejay</div>';
            }
          }
        }
      } catch (\Exception $e) {
        echo '<div class="top-spacer_20 center error">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
      }
    ?>
    <div class="top-spacer_20">
      <a href="deejay_view_all.php">View all Deejays</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
