<?php

function view_all_concerts(){
  $query = "SELECT * FROM concerts WHERE deleted = 'n' AND date >= date(now()) ORDER BY date";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    echo
      "<br><b>Date: </b>". $info['date'].
      "<br><b>Artist: </b>". $info['artist'];
    if ($info['band_pic_url'] != ""){
      echo "<br><b>Band Picture: </b><br> <img src=\"". $info['band_pic_url']. "\" height='100px';>";
    } else {
      echo "<br><b>Band Picture: </b><br> <img src=\"/imgs/na.jpg\" height='100px';>";
    }
    echo "<br><b>Band's Site: </b>". $info['band_url'].
      "<br><b>Venue: </b>". $info['venue'].
      "<br><b>Ticket Info: </b>". $info['ticketinfo'].
      "<br><b>Ticket URL: </b>". $info['ticketurl'].
      "<br><b>Feature this concert on the right: </b>". $info['featured'].
      '<br>[ <a href="editconcert.php?id=' .$info[id]. '">Edit</a> | <a href="deleteconcert.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

function edit_concert($id) {
  $query = "SELECT * FROM concerts where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Edit Concert: '.concertinfo($id).'</h3></center><p>';


  echo '<form action="saveconcert.php?id='.$info["id"].'" method="post">
    <table id="edit_concert" border="0">
    <tr>
    <td>Date:</td>
    <td><input type="text" value="'.$info["date"].'" name="date" maxlength="25" size="25"></td>
    </tr>
    <tr>
    <td>Artist:</td>
    <td><input type="text" value="'.$info["artist"].'" name="artist" maxlength="250" size="90"></td>
    </tr>
    <tr>
    <td>Band Pic:</td>
    <td><input type="text" value="'.$info["band_pic_url"].'" name="band_pic_url" maxlength="115" size="90"></td>
    </tr>
    <tr>
    <td>Band\'s Site:</td>
    <td><input type="text" value="'.$info["band_url"].'" name="band_url" maxlength="115" size="90"></td>
    </tr>
    <tr>
    <td>Venue:</td>
    <td><input type="text" value="'.$info["venue"].'" name="venue" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Ticket Info:</td>
    <td><input type="text" value="'.$info["ticketinfo"].'" name="ticketinfo" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Ticket URL:</td>
    <td><input type="text" value="'.$info["ticketurl"].'" name="ticketurl" maxlength="115" size="90"></td>
    </tr>
    <tr>
    <td>Feature Concert:</td>';
  if ($info["featured"] == "Yes") {
    echo '<td colspan="2"><input type="checkbox" name="featured" value="Yes" checked /></td>';
  } else {
    echo '<td colspan="2"><input type="checkbox" name="featured" value="Yes" /></td>';
  }
  echo '</tr>
    <tr><td colspan="2">
    <input type="submit" value="Save Concert"></td></tr>
    </table>
    </form>
    <p>** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url';
}

function save_concert($id, $date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured) {
  $id = mysql_real_escape_string($id);
  $date = mysql_real_escape_string($date);
  $artist = mysql_real_escape_string($artist);
  $band_pic_url = mysql_real_escape_string($band_pic_url);
  $band_url = mysql_real_escape_string($band_url);
  $venue = mysql_real_escape_string($venue);
  $ticketinfo = mysql_real_escape_string($ticketinfo);
  $ticketurl = mysql_real_escape_string($ticketurl);

  if ($featured != "Yes")
    $featured = "No";

  $update = "UPDATE concerts SET date=\"$date\", artist=\"$artist\", band_pic_url=\"$band_pic_url\", band_url=\"$band_url\",venue=\"$venue\", ticketinfo=\"$ticketinfo\", ticketurl=\"$ticketurl\", featured=\"$featured\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h3>Concert (". concertinfo($id) . ") has been saved</h3></center><br>";
}

function add_concert($date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured) {
  $date = mysql_real_escape_string($date);
  $artist = mysql_real_escape_string($artist);
  $band_pic_url = mysql_real_escape_string($band_pic_url);
  $band_url = mysql_real_escape_string($band_url);
  $venue = mysql_real_escape_string($venue);
  $ticketinfo = mysql_real_escape_string($ticketinfo);
  $ticketurl = mysql_real_escape_string($ticketurl);

  if ($featured != "Yes")
    $featured = "No";

  $insert = "INSERT INTO concerts VALUES (id, '".$date ."', '".$artist. "', '".$band_pic_url. "', '".$band_url. "', '". $venue ."', '". $ticketinfo ."', '". $ticketurl ."', '". $featured ."', 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>". $artist. " at ".$venue ."</h3><p>".
    "\n<br><hr width=75%>".
    "\n<br><b>Date:</b> ". $date.
    "\n<br><b>Artist:</b> ". $artist.
    "\n<br><b>Band Picture:</b>\n<br> <img src=\"". $band_pic_url. "\" height='100px';>".
    "\n<br><b>Band's Site:</b> ". $band_url.
    "\n<br><b>Venue:</b> ". $venue.
    "\n<br><b>Ticket Info:</b> ". $ticketinfo. "\n".
    '<br><b>Ticket URL:</b> <a href="'. $ticketurl . '" target=_new>'.$ticketurl .'</a> '.
    "\n<br><b>Feature this concert on the right:</b> ". $featured. "\n".
    "<p></center>\n";
}

function concert_info($id) {
  $select = "SELECT * FROM concerts where id=".$id;
  $result = mysql_query($select);

  if (!$result) {
    echo $select ."<br>";
    die('Error Getting Database Entry.');
  }

  $info = mysql_fetch_assoc($result);

  $artistvenue = $info['artist']. " at " . $info['venue'];
  return $artistvenue;
}

function delete_concert($id){
  $update = "UPDATE concerts SET deleted ='y' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>". concertinfo($id) . " has been deleted.</h3></center><p>";
}

function show_concerts(){
  //TODO: add date logic here - right now it will just display all sorted by ID (order of entry)
  $query = "SELECT DATE_FORMAT(date, '%a %m/%d' ) as fdate, artist, venue, ticketinfo, ticketurl FROM concerts WHERE deleted = 'n' AND date >= date(now()) ORDER BY date";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<table class="table table-striped table-bordered-horizontal table-condensed">';
  echo '<col width="100"><col><col width="175"><col width="150">';
  echo "<thead><tr><th width=\"100px\">Date</th><th>Artist</th><th width=\"150px\">Venue</th><th width=\"125px\">Ticket Info</th></tr></thead>\n";
  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);

    echo "<tr><td>" . $info['fdate']. "</td>\n".
      "<td>" . $info['artist']. "</td>\n".
      "<td>" . $info['venue']. "</td>\n";
    if ($info['ticketurl'] && $info['ticketinfo'] != "SOLD OUT"){
      echo "<td><a href=\"" . $info['ticketurl']. "\" target=_new>". $info['ticketinfo']. "</a></td>\n";
    } elseif ($info['ticketurl'] && $info['ticketinfo'] == "SOLD OUT") {
      echo "<td class=\"soldout\"><a href=\"" . $info['ticketurl']. "\" target=_new>". $info['ticketinfo']. "</a></td>\n";
    } else {
      echo "<td>". $info['ticketinfo']. "</td>\n";
    }
    echo "</tr>\n";
  }
  echo '</table>';
}

?>
