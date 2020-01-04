<?php

function add_concert($date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured) {
  $date = mysqli_real_escape_string(open_db(), $date);
  $artist = mysqli_real_escape_string(open_db(), $artist);
  $band_pic_url = mysqli_real_escape_string(open_db(), $band_pic_url);
  $band_url = mysqli_real_escape_string(open_db(), $band_url);
  $venue = mysqli_real_escape_string(open_db(), $venue);
  $ticketinfo = mysqli_real_escape_string(open_db(), $ticketinfo);
  $ticketurl = mysqli_real_escape_string(open_db(), $ticketurl);

  if ($featured != "Yes")
    $featured = "No";

  $insert = "INSERT INTO concerts VALUES (id, '".$date ."', '".$artist. "', '".$band_pic_url. "', '".$band_url. "', '". $venue ."', '". $ticketinfo ."', '". $ticketurl ."', '". $featured ."', 'n')";
  $result = mysqli_query(open_db(), $insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New Concert with ". $artist. " at ". $venue ." has been saved</h3>".
       "<hr width=75%>";
  display_concert(get_concert(mysqli_insert_id(open_db())));
  echo "</div>";
}

function concert_info($id) {
  $select = "SELECT * FROM concerts where id=".$id;
  $result = mysqli_query(open_db(), $select);

  if (!$result) {
    echo $select ."<br>";
    die('Error Getting Database Entry.');
  }

  $info = mysqli_fetch_assoc($result);

  $artistvenue = $info['artist']. " at " . $info['venue'];
  return $artistvenue;
}

function delete_concert($id){
  $update = "UPDATE concerts SET deleted ='y' where id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result) {
    echo "'Error deleting the concert from the database: ". $update ."<br>";
  } else {
    $concert = get_concert($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The concert for <span class=\"success\">". $concert['artist'] ." at ". $concert['venue'] ."</span> has been deleted.</h3></div>";
  }
}

function display_concert($concert) {
    echo
      "<br><b>Date: </b>". $concert['date'].
      "<br><b>Artist: </b>". $concert['artist'];
    if ($concert['band_pic_url'] != "")
      echo "<br><b>Band Picture: </b><br> <img src=\"". $concert['band_pic_url']. "\" height='100px';>";
    else
      echo "<br><b>Band Picture: </b><br> <img src=\"imgs/na.jpg\" height='100px';>";
    echo "<br><b>Band's Site: </b>". $concert['band_url'].
      "<br><b>Venue: </b>". $concert['venue'].
      "<br><b>Ticket Info: </b>". $concert['ticketinfo'].
      "<br><b>Ticket URL: </b>". $concert['ticketurl'].
      "<br><b>Feature this concert on the right: </b>". $concert['featured'];
}

function get_concert($id) {
  $query = "SELECT * FROM concerts where id=".$id;
  $result = mysqli_query(open_db(), $query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysqli_fetch_assoc($result);
}

function show_concerts(){
  $query = "SELECT DATE_FORMAT(date, '%a %m/%d' ) as fdate, artist, venue, ticketinfo, ticketurl FROM concerts WHERE deleted = 'n' AND date >= date(now()) ORDER BY date";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<table class="table table-striped table-bordered-horizontal table-condensed">';
  echo '<col width="100"><col><col width="175"><col width="150">';
  echo "<thead><tr><th width=\"100px\">Date</th><th>Artist</th><th width=\"150px\">Venue</th><th width=\"125px\">Ticket Info</th></tr></thead>\n";
  for ($i=1; $i<=mysqli_num_rows($result);$i++)
  {
    $info = mysqli_fetch_assoc($result);

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

function update_concert($id, $date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured) {
  $id = mysqli_real_escape_string(open_db(), $id);
  $date = mysqli_real_escape_string(open_db(), $date);
  $artist = mysqli_real_escape_string(open_db(), $artist);
  $band_pic_url = mysqli_real_escape_string(open_db(), $band_pic_url);
  $band_url = mysqli_real_escape_string(open_db(), $band_url);
  $venue = mysqli_real_escape_string(open_db(), $venue);
  $ticketinfo = mysqli_real_escape_string(open_db(), $ticketinfo);
  $ticketurl = mysqli_real_escape_string(open_db(), $ticketurl);

  if ($featured != "Yes")
    $featured = "No";

  $update = "UPDATE concerts SET date=\"$date\", artist=\"$artist\", band_pic_url=\"$band_pic_url\", band_url=\"$band_url\",venue=\"$venue\", ticketinfo=\"$ticketinfo\", ticketurl=\"$ticketurl\", featured=\"$featured\" WHERE id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function view_all_concerts(){
  $query = "SELECT * FROM concerts WHERE deleted = 'n' AND date >= date(now()) ORDER BY date";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
    for ($i=1; $i<=mysqli_num_rows($result);$i++)
    {
      $info = mysqli_fetch_assoc($result);
      display_concert($info);
      echo '<br>[ <a href="concert_update.php?id=' .$info[id]. '">Edit</a> | <a href="concert_delete.php?id=' .$info[id]. '">Delete</a> ] <p>';
    }
  echo '</ol>';
}

?>
