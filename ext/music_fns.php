<?php

function display_music() {
  $date_query = "SELECT date FROM music WHERE deleted = 'n' AND date > CURDATE() - INTERVAL 6 MONTH GROUP BY date ORDER BY date DESC";
  $date_result = mysql_query($date_query);

  if (!$date_result) {
    die('No results in database.');
  }

  $music_query = "SELECT * FROM music WHERE deleted = 'n' ORDER BY date DESC, artist";
  $music_result = mysql_query($music_query);

  if (!$music_result) {
    die('No results in database.');
  }

  echo "<dl class=\"new_music\">";
  for ($i=1; $i<=mysql_num_rows($date_result);$i++)
  {
    $date_info = mysql_fetch_assoc($date_result);
    echo "<dt>New Music Week of ". $date_info['date']. "</dt>";
    for ($j=1; $j<=mysql_num_rows($music_result);$j++)
    {
      $music_info = mysql_fetch_assoc($music_result);
      echo "<dd>";
      if ($music_info['date'] == $date_info['date'] && $music_info['url'])
        echo $music_info['artist'] . " - <a href=\"" . $music_info['url']. "\" target=_new> ". $music_info['song'] ." </a>";
      if ($music_info['date'] == $date_info['date'] && !$music_info['url'])
        echo $music_info['artist'] . " - " . $music_info['song'];
      echo "</dd>";
    }
    mysql_data_seek( $music_result, 0 );
  }
  echo "</dl>";
}

function add_music($date, $artist, $song, $url) {
  if (!get_magic_quotes_gpc()){
    $date = addslashes($date);
    $artist = addslashes($artist);
    $song = addslashes($song);
    $ticketurl = addslashes($url);
  }

  $insert = "INSERT INTO music VALUES (id, '".$artist. "', '". $song ."', '". $url ."', '". $date ."', 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p>".
    "<br><hr width=75%>".
    "<br><b>Date:</b> ". $date.
    "<br><b>Artist:</b> ". $artist.
    "<br><b>Song:</b> ". $song.
    '<br><b>Ticket URL:</b> <a href="'. $ticketurl . '">'.$ticketurl .'</a> '.
    "<p>";
}

function view_all_music(){
  $query = "SELECT * FROM music WHERE deleted = 'n' ORDER BY date DESC, artist";
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
      "<br><b>Artist: </b>". $info['artist'].
      "<br><b>Song: </b>". $info['song'].
      "<br><b>Song URL: </b>". $info['url'].
      '<br>[ <a href="editmusic.php?id=' .$info[id]. '">Edit</a> | <a href="deletemusic.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

function edit_music($id) {
  $query = "SELECT * FROM music where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Edit Music:</h3></center><p>';

  echo '<form action="savemusic.php?id='.$info["id"].'" method="post">
    <table id="edit_music" border="0">
    <tr>
    <td>Date:</td>
    <td><input type="text" value="'.$info["date"].'" name="date" maxlength="25" size="25"></td>
    </tr>
    <tr>
    <td>Artist:</td>
    <td><input type="text" value="'.$info["artist"].'" name="artist" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Song:</td>
    <td><input type="text" value="'.$info["song"].'" name="song" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Song URL:</td>
    <td><input type="text" value="'.$info["url"].'" name="url" maxlength="100" size="100"></td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save Music"></td></tr>
    </table>
    </form>';
}

function save_music($id, $date, $artist, $song, $url) {
  if (!get_magic_quotes_gpc())
  {
    $id = addslashes($id);
    $date = addslashes($date);
    $artist = addslashes($artist);
    $song = addslashes($song);
    $url = addslashes($url);
  }

  $update = "UPDATE music SET date=\"$date\", artist=\"$artist\", song=\"$song\", url=\"$url\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }
}

function delete_music($id){
  $update = "UPDATE music SET deleted ='y' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>The New Music entry has been deleted.</h3></center><p>";
}

?>
