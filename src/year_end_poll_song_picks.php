<?php

$page_file = "year_end_poll_song_picks.php.php";
$page_title = "Year End Poll Contestant's Song Picks";

require ("functions/main_fns.php");
require ("functions/year_end_poll_fns.php");
require ("partials/_header.php");

$contestant_id = $_GET['contestant_id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Year End Poll Contestant's Song Picks</h1>
      <?php view_contestants_song_picks($contestant_id); ?>
    <br>
    <div class="top-spacer_20">
      <a href="year_end_poll_contestants.php">View all Year End Poll Contestants</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
