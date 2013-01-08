<?php

function display_featured_concerts(){
  $results = get_featured_concerts();
  echo "<h3>Featured Concerts</h3><p>\n";
  if  (mysql_num_rows($results) > 0) {
    for ($i=1; $i<=mysql_num_rows($results);$i++)
    {
      $info = mysql_fetch_assoc($results);
      echo 
        "<div class=\"featured_concert\">".
          "<div class=\"artist\">". $info['artist']. "</div>\n".
          "<div><img src=\"". $info['band_pic_url']. "\" alt=\"".$info['artist']. "\" border=\"1\" height='100px';></div>\n" .
          "<div>" . $info['fdate']. "</div>\n".
          "<div><a href=\"" . $info['ticketurl']. "\" target=_new>" . $info['venue']. "</a></div>\n".
        "</div>\n";
    }
  } else {
    echo "Welcome to the all new Y-Not Radio. You've discovered the station that carries on the legacy of Y100, Y100Rocks, and WDRE. Y-Not Radio is run by former Y-Rock Operations Director Josh T. Landow along with hosts Adrienne, Andre, Brendan McNulty, Cat, Heather, Jeff St. Pierre, Joey O., Liz Romaine, Matt McGrath, Matt Summers, Rafe Pilling, Ramon, and Rob Huff, plus some new voices as well. Together we will continue to bring you the high quality alternative, modern, and indie rock programming that we always have. Thanks for joining us!";
  }
}

function get_featured_concerts(){
	$query = "SELECT DATE_FORMAT(date, '%a %M %D' ) as fdate, artist, band_pic_url, band_url, venue, ticketinfo, ticketurl FROM concerts WHERE deleted = 'n' AND date >= date(now()) AND band_pic_url like 'http%' AND featured = 'Yes' AND ticketinfo != 'SOLD OUT' ORDER BY date LIMIT 0,4";

	$result = mysql_query($query);

	if (!$result) {
		echo "error: ". $query;
		die('Invalid');
		}
  
  return $result;
}

?>
