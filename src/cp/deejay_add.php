<?php

$page_file = "deejay_add.php";
$page_title = "Add a Deejay";

require ("../functions/main_fns.php");
require_once ("../models/DeejayFactory.php");
require ("../partials/_header.php");

$action = $_POST['action'];

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
    <h1>Add a Deejay</h1>
      <?php if ($action != "insert") { ?>
      <form action="deejay_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php 
        $deejay = [
          'name' => '',
          'show' => '',
          'email' => '',
          'external_connect_text' => '',
          'external_connect_url' => '',
          'pic' => ''
        ];
        require ("../partials/_deejay_form.php"); 
        ?>
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

        try {
          $db = open_db();
          $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
          
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
            
            $id = $deejayModel->add($data);
            
            $deejay = $deejayModel->getById($id);
            
            echo "<div class=\"center\"><h1>Success!</h1>".
                 "<h3>New Deejay, ". $name. ", has been saved</h3>".
                 "<hr width=75%>";
            display_deejay($deejay);
            echo "</div>";
          }
        } catch (\Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Deejay</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
