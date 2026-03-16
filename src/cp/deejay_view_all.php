<?php

$page_file = "deejay_view_all.php";
$page_title = "View All DeeJays";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require_once ("../models/DeejayFactory.php");
require ("../partials/_header.php");

// Add CSS for sortable items
echo '<link href="../style/forms.css" rel="stylesheet" type="text/css" media="all">';
echo '<link href="../style/sortable.css" rel="stylesheet" type="text/css" media="all">';

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
    <h1>View all Deejays</h1>
    	<div class="sortable">
      <?php 
      try {
        $db = open_db();
        $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
        $deejays = $deejayModel->getAllFlat();
        
        foreach ($deejays as $deejay) {
          display_deejay($deejay);
        }
      } catch (\Exception $e) {
        echo '<div class="top-spacer_20 center error">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
      }
      ?>
      </div>
    <div class="top-spacer_20">
      <a href="<?php echo htmlspecialchars(get_payload_collection_url('djs')); ?>" target="_blank">View in Payload ↗</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->


<script
  src="https://code.jquery.com/jquery-3.6.0.min.js"
  integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
  crossorigin="anonymous"></script>
<script
  src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"
  integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU="
  crossorigin="anonymous"></script>


  <script src="../js/deejay-sort.js"></script>
  
<?php }
  require ("../partials/_footer.php");
?>
