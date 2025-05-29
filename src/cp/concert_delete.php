<?php

$page_file = "concert_delete.php";
$page_title = "Delete a Concert";

require ("../functions/main_fns.php");
require ("../models/ConcertFactory.php");
require ("../partials/_header.php");

use YNotRadio\Models\ConcertFactory;

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Concert</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        try {
          $concertModel = ConcertFactory::create(open_db());
          $concert = $concertModel->getById($id);
          
          if ($concert) {
            $artistVenue = $concert['artist'] . " at " . $concert['venue'];
            $result = $concertModel->delete($id);
            
            if ($result) {
              echo "<div class=\"center\"><h1>Success!</h1>".
                   "<h3>The concert for <span class=\"success\">". $artistVenue ."</span> has been deleted.</h3></div>";
            } else {
              echo '<div class="top-spacer_20 center error">Error deleting the concert from the database</div>';
            }
          } else {
            echo '<div class="top-spacer_20 center error">Concert not found</div>';
          }
        } catch (Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="concert_view_all.php">View all Concerts</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
