<?php

$page_file = "concert_view_all.php";
$page_title = "View All Concerts";

require ("../functions/main_fns.php");
require ("../models/ConcertFactory.php");
require ("../partials/_header.php");

use YNotRadio\Models\ConcertFactory;

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Concerts</h1>
    <?php 
      try {
        $concertModel = ConcertFactory::create(open_db());
        $upcomingConcerts = $concertModel->getUpcoming();
        
        echo '<ol>';
        foreach ($upcomingConcerts as $concert) {
          // Display concert details
          echo
            "<br><b>Date: </b>". $concert['date'].
            "<br><b>Artist: </b>". $concert['artist'];
          if ($concert['band_pic_url'] != "")
            echo "<br><b>Band Picture: </b><br> <img src=\"". $concert['band_pic_url']. "\" height='100px';>";
          else
            echo "<br><b>Band Picture: </b><br> <img src=\"../imgs/na.jpg\" height='100px';>";
          echo "<br><b>Band's Site: </b>". $concert['band_url'].
            "<br><b>Venue: </b>". $concert['venue'].
            "<br><b>Ticket Info: </b>". $concert['ticketinfo'].
            "<br><b>Ticket URL: </b>". $concert['ticketurl'].
            "<br><b>Feature this concert on the right: </b>". $concert['featured'];
          echo '<br>[ <a href="concert_update.php?id=' .$concert['id']. '">Edit</a> | <a href="concert_delete.php?id=' .$concert['id']. '">Delete</a> ] <p>';
        }
        echo '</ol>';
      } catch (Exception $e) {
        echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
      }
    ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
