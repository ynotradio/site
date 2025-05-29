<?php

$page_file = "concert_add.php";
$page_title = "Add a Concert";

require ("../functions/main_fns.php");
require ("../models/ConcertFactory.php");
require ("../partials/_header.php");

use YNotRadio\Models\ConcertFactory;

$action = $_POST['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Concert</h1>
      <?php if ($action != "insert") { ?>
      <form action="concert_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("../partials/_concert_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $date = $_POST['date'];
        $artist = $_POST['artist'];
        $band_pic_url = $_POST['band_pic_url'];
        $band_url = $_POST['band_url'];
        $venue = $_POST['venue'];
        $ticketinfo = $_POST['ticketinfo'];
        $ticketurl = $_POST['ticketurl'];
        $featured = $_POST['featured'];

        if (!$date || !$artist || !$venue || !$ticketinfo || !$ticketurl) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          try {
            $concertModel = ConcertFactory::create(open_db());
            $concertData = [
              'date' => $date,
              'artist' => $artist,
              'band_pic_url' => $band_pic_url,
              'band_url' => $band_url,
              'venue' => $venue,
              'ticketinfo' => $ticketinfo,
              'ticketurl' => $ticketurl,
              'featured' => $featured
            ];
            
            $newId = $concertModel->add($concertData);
            $concert = $concertModel->getById($newId);
            
            echo "<div class=\"center\"><h1>Success!</h1>".
                 "<h3>New Concert with ". $concert['artist']. " at ". $concert['venue'] ." has been saved</h3>".
                 "<hr width=75%>";
            
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
            echo "</div>";
          } catch (Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Concert</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
