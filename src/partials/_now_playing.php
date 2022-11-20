<?php

require ("../functions/main_fns.php");

$now = time()-70;

$query = "SELECT title, artist, playtime, album FROM now_playing where playtime <= $now ORDER BY playtime DESC LIMIT 0,6";
$result = mysqli_query(open_db(), $query);

if (!$result) {
  echo "error: ". $query;
  die('Invalid');
}

$url_to_refresh = $_SERVER['REQUEST_URI'];
header("Refresh: 30; URL=$url_to_refresh");

$url_to_proxy = 'http://www.iradiophilly.com/nowplayingupdate.php?station=42&composer=0&flag=4';

if($result->num_rows == 0) {
	// make the HTTP request to the requested URL
	$content = file_get_contents($url_to_proxy);
} else {
	$content = null;
}

?>

<body>
    <?php echo $content; ?>

	<div class="last10">
		<table width="443" height="125" cellspacing="1" cellpadding="0">
		<?php
				for ($count = 0; $count<=mysqli_num_rows($result); $count++)
				{

					$play = mysqli_fetch_assoc($result);
					if ($count==0) {$b = "<b>"; $be = "</b>";} else { $b = ""; $be=""; }
					echo "<tr class=\"bodyTextWhite\" bgcolor=\"666666\">";
					echo "<td align=\"left\">". $b . $play["artist"] . $be . "</td>";
					echo "<td align=\"left\">". $b . $play["title"] . $be . "</td>";
					echo "<td align=\"left\">". $b . $play["album"] . $be . "</td>";
					echo "</tr>";
				}
		?> 
		</table>
	</div>

</body>

<style>
@charset "utf-8";
html, body {
 background: #666666;
}
.articleText {
	font-family: 'Roboto', Verdana, sans-serif;
	font-size: 16px !important;
	font-weight: 100;
	color: #000000;
}
.articleHeader {
	font-family: 'Roboto', Verdana, sans-serif;
	font-size: 18px !important;
	color: #000000;
	font-weight: 500;
}
.bodyText {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	color: #757575;
}

.bodyText {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	color: #757575;
}
.bodyTextWhite {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	color: #FFFFFF;
}
.cellbackright {
	background:url(images/main_right_bck.gif) repeat-y;
	width: 4px;
	padding: 0;
}
.cellbackleft {
	background:url(images/main_left_bck.gif) repeat-y;
	width: 4px;
	padding: 0;
}
.bodyHeader {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	font-weight: bold;
	color: #858585;
}
.postHeader {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 15px !important;
	color: #000;
}
.mediaText {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 13px !important;
	color: #000;
}
.header1 {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 16px !important;
	font-weight: bold;
	color: #000;
}
.header2 {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 16px !important;
	color: #000;
	font-weight: lighter;
}
.genre {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	font-style: italic;
	color: #000;
}

.redPlaying {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 10px !important;
	color: #E43535;
}
.largeGrey {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 14px !important;
	color: #8F8F8F;
}
.smallGrey {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	color: #B9B9B9;
}
.smallGreyB {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	color: #8B8B8B;
}
.stationList1 {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 10px !important;
	color: #000;
}
.stationList2 {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 10px !important;
	color: #8F8F8F;
}
.footerText {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 8px !important;
	color: #8A8A8A;
}
.byline {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 9px !important;
	font-weight: bold;
	color: #8f8f8f;
}
.redLarge {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 13px !important;
	color: #E43535;
}
.greenLarge {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 13px !important;
	color: #69a892;
}
.menuText {
	font-family: Verdana, Geneva, sans-serif;
	font-size: 11px !important;
	color: #8A8A8A;
}
.articleHeader a {
	color: #000000;
	text-decoration: none;
}
.postHeader a {
	color: #000000;
	text-decoration: none;
}
.stationList2 a {
	color: #8f8f8f;
}
.stationList1 a {
	color: #000;
}
.byline a {
	color: #8f8f8f;
}
.bodyText a {
	color: #707070;
}
.menuText a {
	color: #8f8f8f;
	text-decoration: none;
}
.footerText a {
	color: #8f8f8f;
}
.smallGrey a {
	color: #B9B9B9;
	text-decoration: none;
}
.smallGreyB a {
	color: #8B8B8B;
}
.bodyHeader a {
	color: #8f8f8f;
}
.articleText a {
	color: #8f8f8f;
}
.redLarge a {
	color: #E43535;
}
.redPlaying a {
	color: #E43535;
}
.formField {
	background-color:#f4f3e8;
	border: 1px solid #bcbcbc;
}
td.normal { background-color: #FFFFFF; text-decoration: none;}
  .highlight { background-color: #F3F3E8; text-decoration: none;}
  .leftbar { background-image: url("images/leftbar.jpg");
  			  background-repeat: repeat-y;}
  .rightbar { background-image: url("images/rightbar.jpg");
  			  background-repeat: repeat-y;}
td.highlight a { text-decoration: none; }
tr.highlight a { text-decoration: none; }
#blocks td a:hover {
        background: #F3F3E8;
		text-decoration: none;
}
#blocks table a:hover {
        background: #F3F3E8;
		text-decoration: none;
}
#blocks tr a:hover {
        background: #F3F3E8;
		text-decoration: none;
}
#blocks td a {
        display: block;
        border: 0;
        text-decoration: none;
		background: #FFFFFF;
}
#blocks tr a {
        display: block;
        border: 0;
        text-decoration: none;
		background: #FFFFFF;
}
#blocks table a {
        display: block;
        border: 0;
        text-decoration: none;
		background: #FFFFFF;
}
.st span {
text-shadow: 1px 1px 1px #FFF;
}

</style>
