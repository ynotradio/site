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
      
      echo "<tr><td data-label=\"Date\"><span class=\"concerts-cell-value\">" . $fdate . "</span></td>\n".
        "<td data-label=\"Artist\"><span class=\"concerts-cell-value\">" . sanitize_concert_title_html($concert['artist']) . "</span></td>\n".
        "<td data-label=\"Venue\"><span class=\"concerts-cell-value\">" . $concert['venue'] . "</span></td>\n";
      
      if ($concert['ticketurl']) {
        $soldout_class = $concert['ticketinfo'] === "SOLD OUT" ? ' class="soldout"' : '';
        echo "<td data-label=\"Ticket Info\"{$soldout_class}><span class=\"concerts-cell-value\"><a href=\"" . $concert['ticketurl'] . "\" target=_new>" . $concert['ticketinfo'] . "</a></span></td>\n";
      } else {
        echo "<td data-label=\"Ticket Info\"><span class=\"concerts-cell-value\">" . $concert['ticketinfo'] . "</span></td>\n";
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
