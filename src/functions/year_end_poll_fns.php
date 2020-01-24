<?php

function add_contestant($name, $email, $phone, $hometown, $contest, $newsletter, $ip){
  $name = addslashes($name);
  $email = addslashes($email);
  $phone = addslashes($phone);
  $hometown = addslashes($hometown);
  $contest = addslashes($contest);
  $newsletter  = addslashes($newsletter);
  $ip = addslashes($ip);

	$insert = "INSERT INTO year_end_contestants VALUES (id, '".$name. "', '".$email. "', '".$phone. "', '".$hometown. "', '".$contest. "', '".$newsletter. "', '".$ip. "')";
	$result = mysqli_query(open_db(), $insert);

	return ($result) ? true : false;
}

function add_manual_vote_for($ip, $poll_form, $manual_vote) {
  $manual_vote = mysqli_real_escape_string(open_db(), $manual_vote);

  $insert = "INSERT INTO year_end_write_ins (ip_address, poll, write_in) VALUES (\"". $ip ."\", \"" . $poll_form . "\", \"" . $manual_vote . "\")";
  $result = mysqli_query(open_db(), $insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  } else {
    return true;
  }
}

function add_ip($ip, $poll) {
  $insert = "INSERT INTO year_end_ips VALUES (id, '".$ip ."', '" . $poll . "')";
  $result = mysqli_query(open_db(), $insert);
	
  if (!$result) {
	  echo $insert ."<br>";
	  die('Error Inserting into Database.');
	}	
}

function add_song_votes_for($ip, $votes, $write_in_value) {
  $last_value = ( $write_in_value != '') ? $write_in_value : $votes[19];

  $insert = "INSERT INTO year_end_song_votes VALUES (NULL, '".$ip."', '".$votes[0]."', '".$votes[1]."', '".$votes[2]."', '".$votes[3]."', '".$votes[4]."', '".$votes[5]."', '".$votes[6]."', '".$votes[7]."', '".$votes[8]."', '".$votes[9]."', '".$votes[10]."', '".$votes[11]."', '".$votes[12]."', '".$votes[13]."', '".$votes[14]."', '".$votes[15]."', '".$votes[16]."', '".$votes[17]."', '".$votes[18]."', '".$last_value."')";
  $result = mysqli_query(open_db(), $insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }
}

function add_votes_for($poll_form, $votes){
  foreach ($votes as $value) {
    $update = "UPDATE year_end_". $poll_form ." SET votes = votes + 1 WHERE id=". $value;
    $result = mysqli_query(open_db(), $update);

    if (!$result) {
      echo $insert ."<br>";
      die('Error Inserting into Database.');
    }
  }
  return true;
}

function can_enter_contest($ip) {
  $answer = true;
  $needed_polls = array('songs', 'albums', 'artists', 'new_artists', 'philly_artists',
                       'most_anticipated_albums', 'concerts');

  foreach ($needed_polls as $poll) {
    $answer = $answer && has_voted($ip, $poll);
  }
  return $answer;
}

function format_poll_header($current_poll, $category) {
  $category = str_replace('Tv', 'TV', $category);
  $category = ($current_poll == 'unnecessary_sequels') ? $category . ' or Reboots ': $category;
  $saddest = ($current_poll == 'celebrity_deaths') ? ' Saddest ' : '';
  $suffix = ($current_poll != 'most_anticipated_albums') ? ' of this Year' : ' for next Year';

  return "Vote for Your Top <span id=\"max_pick\">" . max_picks_for($current_poll) ."</span> " . $saddest . $category . $suffix;
}

function format_poll_name($str) {
  if ($str == 'most_anticipated_albums')
      $str = 'most_anticipated_'.(date('Y') + 1). '_albums';
  return str_replace("_", " ", $str);
}

function get_column_names($poll) {
  $describe = mysqli_query(open_db(), 'DESCRIBE year_end_'.$poll);
  $column_names = array();

  for ($i=1; $i<=mysqli_num_rows($describe); $i++) {
    $info = mysqli_fetch_assoc($describe);
    array_push($column_names, $info['Field']);
  }

  return $column_names;
}

function get_number_of_votes_for($poll_form, $value) {
  $query = "SELECT votes FROM year_end_" . $poll_form . " WHERE id=" . $value . ";";
  $result = mysqli_query(open_db(), $query);
  $votes = mysqli_fetch_assoc($result);

  if (!$result)
    die('No results in database.');
  else
    return $votes['votes'];
}

function get_poll_names() {
  return array('songs', 'albums', 'artists', 'new_artists', 'philly_artists',
               'most_anticipated_albums', 'concerts', 'tv_dramas', 'tv_comedies', 'late_night_tv',
               'best_movies', 'worst_movies', 'unnecessary_sequels','celebrity_deaths');
}

function get_song($id) {
  $query = "SELECT * FROM year_end_songs WHERE id =" .$id;
  $result = mysqli_query(open_db(), $query);

  if (!$result)
   return;
  else
    return mysqli_fetch_assoc($result);
}

function get_values($table_name) {
  $columns = get_column_names($table_name);

  $query = "SELECT * FROM year_end_". $table_name . " ORDER BY " . $columns[1];
  $result = mysqli_query(open_db(), $query);

  if (!$result)
    die('No results in database.');
  else
    return $result;
}

function has_entered_contest($ip) {
  $query = "SELECT ip_address FROM year_end_contestants WHERE ip_address = '".$ip."'";
  $result = mysqli_query(open_db(), $query);

  $info = mysqli_fetch_assoc($result);
  return ($info['ip_address'] == $ip) ? true : false;
}

function has_voted($ip, $poll){
  $query = "SELECT * FROM year_end_ips WHERE ip_address = '".$ip."' AND poll = '".$poll."'";
  $result = mysqli_query(open_db(), $query);

  $info = mysqli_fetch_assoc($result);
  if ($info['ip_address']) {
		return true;
	} else {
	  return false;
	}
}

function klass($ip, $poll) {
  $klass = 'poll';

  if (has_voted($ip, $poll) == true)
    $klass .= ' completed ';

  if ($poll ==  $_GET['poll'])
      $klass .= ' current';

  return $klass;
}

function create_link($ip, $poll) {
  return (has_voted($ip, $poll))? "yearendpoll.php" : "yearendpoll.php?poll=".$poll;
}

function max_picks_for($poll) {
  $max_picks = array(
    "songs" => "20",
    "albums" => "10",
    "artists" => "5",
    "new_artists" => "3",
    "philly_artists" => "5",
    "concerts" => "2",
    "music_videos" => "2",
    "biggest_comebacks" => "2",
    "most_anticipated_albums" => "2",
    "tv_dramas" => "3",
    "tv_comedies" => "3",
    "late_night_tv" => "2",
    "best_movies" => "3",
    "worst_movies" => "2",
    "unnecessary_sequels" => "2",
    "celebrity_deaths" => "3");

  return $max_picks[$poll];
}

function view_all_contestants() {
  $query = "SELECT * FROM year_end_contestants";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }
  echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n<thead>\n
    <th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Contest</th><th>Newsletter</th></thead>";
  for ($i=1; $i<=mysqli_num_rows($result); $i++) {
    $info = mysqli_fetch_assoc($result);
    echo "<tr>";
    if ($info['contest'] == 'yes')
      echo "<td><a href=\"year_end_poll_song_picks.php?contestant_id=". $info['id']. "\">" . ucwords($info['name']) ."</a></td>";
    else
      echo "<td>" . ucwords($info['name']) ."</td>";
    echo "<td>" . $info['email'] . "</td>
    <td>" . $info['phone'] . "</td>
    <td>" . ucwords($info['hometown']) . "</td>
    <td>" . $info['contest'] . "</td>
    <td>" . $info['newsletter'] . "</td>
    </tr>";
  }
  echo "</table>";
}

function view_all_year_end_poll_for($poll) {
  $column_names = get_column_names($poll);

  echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n<thead>";
    for ($i=0; $i<=count($column_names); $i++) {
      if ($column_names[$i] != 'id')
        echo "<th>" . ucwords(format_poll_name($column_names[$i])). "</th>";
    }
  echo "</thead>\n";

  $query = "SELECT * FROM year_end_".$poll. " ORDER BY votes DESC, " . $column_names[1] . " ASC";
  $result = mysqli_query(open_db(), $query);

  for ($i=1; $i<=mysqli_num_rows($result); $i++) {
    $info = mysqli_fetch_assoc($result);
    echo "<tr>";
    for ($j=1; $j <=count($column_names); $j++) {
      echo "<td>" .$info[$column_names[$j]] . "</td>";
    }
  echo "</tr>";
  }
  echo "</table";
}

function view_all_year_end_poll_write_ins_for($poll) {
  $query = "SELECT * FROM year_end_write_ins WHERE poll = '".$poll."'";
  $result = mysqli_query(open_db(), $query);

  if (mysqli_num_rows($result) > 0 ) {
    echo "<div class=\"row\">\n<div class=\"tweleve columns content full-width\">\n
    <h1>Write-ins</h1>\n<ul>\n";
    for ($i=1; $i<=mysqli_num_rows($result);$i++)
   	{
  		$info = mysqli_fetch_assoc($result);
      echo "<li>" . $info['write_in'] . "</li>";
    }
    echo "</ul>\n</div>\n</div>";
  } else
    echo "<h3>There are no write-ins.</h3>";
}

function view_contestants_song_picks($contestant_id) {
  $contestant_query = "SELECT * FROM year_end_contestants WHERE id = ".$contestant_id;
  $contestant_result = mysqli_query(open_db(), $contestant_query);

  if (!$contestant_result)
    die('No results in database.');
  else
    $contestant = mysqli_fetch_assoc($contestant_result);

  $song_vote_query = "SELECT * FROM year_end_song_votes WHERE ip_address = \"".$contestant['ip_address']."\"";
  $song_vote_result = mysqli_query(open_db(), $song_vote_query);

  if (mysqli_num_rows($song_vote_result) == 0)
    die('No song results in database.');
  else
    $song_votes = mysqli_fetch_assoc($song_vote_result);

  if ($contestant['contest'] == 'yes') {
    echo "<h3 class=\"center\">" .ucwords($contestant['name']). "'s Top 20 Songs</h3>";
    echo "<ul>";
      for($i=1; $i<=20; $i++) {
        $song = get_song($song_votes['song'.$i]);
        if ($song)
          echo "<li>".$song['artist']. " - " . $song['title'] . "</li>";
        else
          echo "<li><b>WRITE IN:</b> ". $song_votes['song'.$i] . "</li>";
      }
    echo "</ul>";

  } else {
    echo "<div class=\"center\"><strong>This contestant does not wish to participate in the contest</strong></div>";
  }
}
?>
