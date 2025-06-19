<?php

$page_file = "deejays.php";
$page_title = "DeeJays";

require ("functions/main_fns.php");
require_once ("models/DeejayFactory.php");
require ("partials/_header.php");

// Initialize database connection
$db = open_db();
$deejayModel = \YNotRadio\Models\DeejayFactory::create($db);

$deejays = $deejayModel->getAll();

// Function moved from deejay_fns.php
function display_all_deejays($deejays) {
  for ($i=0; $i < sizeof($deejays); $i++) {
    $info = $deejays[$i];
    echo "<div class=\"deejay\">".
      "<img src=\"". $info['pic']. "\" width='150px';>\n".
      "<h2>" . $info['name']. "</h2>\n";
    if ($info['show'])
      echo "<div class=\"show_title\">" . $info['show']. "</div>\n";
    echo "<div><a href=\"mailto:".$info['email']."\">E-Mail</a></div>\n";
    if ($info['external_connect_text'] && $info['external_connect_url'])
      echo "<div><a href=\"" . $info['external_connect_url'] ."\" target=_new>". $info['external_connect_text'] . "</a></div>\n";
    echo "</div>";
  }
}

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>DeeJays</h1>
    <div class="row">
      <div class="six columns">
        <?php display_all_deejays($deejays[1]); ?>
      </div>
      <div class="six columns">
        <?php display_all_deejays($deejays[2]); ?>
      </div>
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
