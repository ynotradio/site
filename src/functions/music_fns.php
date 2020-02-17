<?php

function add_music($date, $artist, $song, $url) {
  $date = mysqli_real_escape_string(open_db(), $date);
  $artist = mysqli_real_escape_string(open_db(), $artist);
  $song = mysqli_real_escape_string(open_db(), $song);
  $url = mysqli_real_escape_string(open_db(), $url);

  $insert = "INSERT INTO music VALUES (id, '".$artist. "', '". $song ."', '". $url ."', '". $date ."', 'n')";
  $link = open_db();
  $result = mysqli_query($link, $insert);;

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New Music, ". $artist. " - ". $song. ", has been saved</h3>".
       "<hr width=75%>";
  display_music(get_music(mysqli_insert_id($link)));
  echo "</div>";
}

function delete_music($id){
  $update = "UPDATE music SET deleted ='y' where id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result) {
    echo "'Error deleting the music entry from the database: ". $update ."<br>";
  } else {
    $music = get_music($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
      "<h3>The new music entry <span class=\"success\">". $music['artist'] ." - ".  $music['song'] ."</span> has been deleted.</h3></div>";
  }
}

function display_music($music) {
    echo "<br><b>Date:</b> ". $music['date'].
    "<br><b>Artist:</b> ". $music['artist'].
    "<br><b>Song:</b> ". $music['song'].
    '<br><b>Song URL:</b> <a href="'. $music['url'] . '" target="_blank">'.$music['url'] .'</a> ';
}

function display_all_music() {
  $date_query = "SELECT date FROM music WHERE deleted = 'n' AND date > CURDATE() - INTERVAL 6 MONTH GROUP BY date ORDER BY date DESC";
  $date_result = mysqli_query(open_db(), $date_query);

  if (!$date_result) {
    die('No results in database.');
  }

  $music_query = "SELECT * FROM music WHERE deleted = 'n' ORDER BY date DESC, artist";
  $music_result = mysqli_query(open_db(), $music_query);

  if (!$music_result) {
    die('No results in database.');
  }

  echo "<dl class=\"new_music\">";
  for ($i=1; $i<=mysqli_num_rows($date_result);$i++)
  {
    $date_info = mysqli_fetch_assoc($date_result);
    echo "<dt>New Music Week of ". $date_info['date']. "</dt>";
    for ($j=1; $j<=mysqli_num_rows($music_result);$j++)
    {
      $music_info = mysqli_fetch_assoc($music_result);
      echo "<dd>";
      if ($music_info['date'] == $date_info['date'] && $music_info['url'])
        echo $music_info['artist'] . " - <a href=\"" . $music_info['url']. "\" target=_new> ". $music_info['song'] ." </a>";
      if ($music_info['date'] == $date_info['date'] && !$music_info['url'])
        echo $music_info['artist'] . " - " . $music_info['song'];
      echo "</dd>";
    }
    mysqli_data_seek( $music_result, 0 );
  }
  echo "</dl>";
}

function get_music($id) {
  $query = "SELECT * FROM music where id=".$id;
  $result = mysqli_query(open_db(), $query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysqli_fetch_assoc($result);
}

function update_music($id, $date, $artist, $song, $url) {
  $id = mysqli_real_escape_string(open_db(), $id);
  $date = mysqli_real_escape_string(open_db(), $date);
  $artist = mysqli_real_escape_string(open_db(), $artist);
  $song = mysqli_real_escape_string(open_db(), $song);
  $url = mysqli_real_escape_string(open_db(), $url);

  $update = "UPDATE music SET date=\"$date\", artist=\"$artist\", song=\"$song\", url=\"$url\" WHERE id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function view_all_music(){
  $query = "SELECT * FROM music WHERE deleted = 'n' AND date > DATE_SUB(now(), INTERVAL 6 MONTH) ORDER BY date DESC, artist";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysqli_num_rows($result);$i++) {
    $info = mysqli_fetch_assoc($result);
    display_music($info);
    echo'<br>[ <a href="music_update.php?id=' .$info['id']. '">Edit</a> | <a href="music_delete.php?id=' .$info['id']. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

?>
