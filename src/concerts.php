<?php

$page_file = "concerts.php";
$page_title = "Concerts";

require ("functions/main_fns.php");
require ("functions/concert_title.php");
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
    echo '<div class="table-responsive concerts-table-wrapper">';
    echo '<table class="table table-striped table-bordered-horizontal table-condensed concerts-table">';
    echo '<colgroup><col class="concerts-col-date"><col><col class="concerts-col-venue"><col class="concerts-col-ticket"></colgroup>';
    echo "<thead><tr><th>Date</th><th>Artist</th><th>Venue</th><th>Ticket Info</th></tr></thead>\n";
    
    foreach ($upcomingConcerts as $concert) {
      $fdate = date('D m/d', strtotime($concert['date']));
      
      echo "<tr><td data-label=\"Date\">" . $fdate . "</td>\n".
        "<td data-label=\"Artist\">" . sanitize_concert_title_html($concert['artist']) . "</td>\n".
        "<td data-label=\"Venue\">" . $concert['venue'] . "</td>\n";
      
      if ($concert['ticketurl'] && $concert['ticketinfo'] != "SOLD OUT") {
        echo "<td data-label=\"Ticket Info\"><a href=\"" . $concert['ticketurl'] . "\" target=_new>". $concert['ticketinfo'] . "</a></td>\n";
      } elseif ($concert['ticketurl'] && $concert['ticketinfo'] == "SOLD OUT") {
        echo "<td data-label=\"Ticket Info\" class=\"soldout\"><a href=\"" . $concert['ticketurl'] . "\" target=_new>". $concert['ticketinfo'] . "</a></td>\n";
      } else {
        echo "<td data-label=\"Ticket Info\">". $concert['ticketinfo'] . "</td>\n";
      }
      
      echo "</tr>\n";
    }
    
    echo '</table>';
    echo '</div>';
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
