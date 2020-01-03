<?php

$page_file = "saveconcert.php";
$page_title = "Save Concert";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/concert_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">

<?php

$id = $_GET['id'];
$date = $_POST['date'];
$artist = $_POST['artist'];
$band_pic_url = $_POST['band_pic_url'];
$band_url = $_POST['band_url'];
$venue = $_POST['venue'];
$ticketinfo = $_POST['ticketinfo'];
$ticketurl = $_POST['ticketurl'];
$featured = $_POST['featured'];

if (!$id || !$date || !$artist || !$venue || !$ticketinfo)
{
	echo 'Error - missing value(s)';
	exit;
}

saveconcert($id, $date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured)

?>
<a href="viewallconcerts.php"><< Back to All Concerts</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>