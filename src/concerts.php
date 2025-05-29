<?php

$page_file = "concerts.php";
$page_title = "Concerts";

require ("functions/main_fns.php");
require ("models/ConcertFactory.php");
require ("partials/_header.php");

use YNotRadio\Models\ConcertFactory;

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Concerts</h1>
    <?php 
    $concertModel = ConcertFactory::create(open_db());
    $upcomingConcerts = $concertModel->getUpcoming();
    
    // Display upcoming concerts in a table
    echo '<table class="table table-striped table-bordered-horizontal table-condensed">';
    echo '<col width="100"><col><col width="175"><col width="150">';
    echo "<thead><tr><th width=\"100px\">Date</th><th>Artist</th><th width=\"150px\">Venue</th><th width=\"125px\">Ticket Info</th></tr></thead>\n";
    
    foreach ($upcomingConcerts as $concert) {
      $fdate = date('D m/d', strtotime($concert['date']));
      
      echo "<tr><td>" . $fdate . "</td>\n".
        "<td>" . $concert['artist'] . "</td>\n".
        "<td>" . $concert['venue'] . "</td>\n";
      
      if ($concert['ticketurl'] && $concert['ticketinfo'] != "SOLD OUT") {
        echo "<td><a href=\"" . $concert['ticketurl'] . "\" target=_new>". $concert['ticketinfo'] . "</a></td>\n";
      } elseif ($concert['ticketurl'] && $concert['ticketinfo'] == "SOLD OUT") {
        echo "<td class=\"soldout\"><a href=\"" . $concert['ticketurl'] . "\" target=_new>". $concert['ticketinfo'] . "</a></td>\n";
      } else {
        echo "<td>". $concert['ticketinfo'] . "</td>\n";
      }
      
      echo "</tr>\n";
    }
    
    echo '</table>';
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
