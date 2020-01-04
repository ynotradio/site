<?php

function add_cdotw($artist, $title, $label, $review, $cd_pic_url, $band, $reviewer, $date) {
  $artist = mysqli_real_escape_string($artist);
  $title = mysqli_real_escape_string($title);
  $label = mysqli_real_escape_string($label);
  $review = mysqli_real_escape_string($review);
  $cd_pic_url = mysqli_real_escape_string($cd_pic_url);
  $band = mysqli_real_escape_string($band);
  $reviewer = mysqli_real_escape_string($reviewer);	
  $date = mysqli_real_escape_string($date);	

  $insert = "INSERT INTO cdotw VALUES (id, '".$artist ."', '".$title ."', '".$label ."', '".$review ."', '".$cd_pic_url ."', '".$band ."', '".$reviewer ."', '".$date ."', 'no')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>New review for <span class=\"success\">". $artist. " - ". $title. "</span> has been saved</h3>".
    "<hr width=75%>";
    display_cdotw(get_cdotw(mysql_insert_id()));
    echo "</div>";
}

function cdotw($id){
  $id = validate_id($id);

  if ($id == '') {
    $date = "SELECT date, DATE_FORMAT(date, '%c/%d/%y' ) as fdate FROM cdotw GROUP BY date ORDER BY date DESC LIMIT 0,1";
    $date_result = mysql_query($date);

    if (!$date_result) {
      die('Invalid');
    }

    $datepicker = mysql_fetch_assoc($date_result);

    $query = "SELECT * FROM cdotw WHERE deleted = 'no' AND date = \"". $datepicker['date'] . "\"";
    $result = mysql_query($query);
  } else {
    $date = "SELECT DATE_FORMAT(date, '%c/%d/%y' ) as fdate FROM cdotw WHERE id = ".$id;
    $date_result = mysql_query($date);

    if (!$date_result) {
      die('Invalid');
    }

    $datepicker = mysql_fetch_assoc($date_result);

    $query = "SELECT * FROM cdotw WHERE deleted = 'no' AND id = " . $id;
    $result = mysql_query($query);
  }

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo "Week of ". $datepicker['fdate'];
  echo '<ul>';
  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    echo "<h3>" . $info['artist']. " - <em>". $info['title']. "</em> (".$info['label']. ")</h3>\n".
      "<div class='review'> <a href=\"" . $info['band'] ."\" target=_new><img src=\"" . $info['cd_pic_url'] . "\" height=\"200\"> </a>\n".
      $info['review'] . "</div>\n".
      "<div class=\"footnote\">Review by " . $info['reviewer'] . "</div>\n";
    if ($i != mysql_num_rows($result))
      echo "<p>\n<hr width=80%>\n";
  }	
  echo '</ul>';			
}

function cover_art() {
  $query = "SELECT * FROM cdotw WHERE deleted = 'no' ORDER BY date DESC LIMIT 64";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<table class="table-center">';
  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    if (fmod($i,8) == 1) {	
      echo "<tr>\n";
    }
    echo "<td>\n<a class=\"past_review\" href=\"cdoftheweek.php?id=". $info['id']."\"> <img src=\"" . $info['cd_pic_url'] . "\" height=\"100\" width=\"100\" ></a>\n</td>\n";
    if (fmod($i,8) == 0) {	
      echo "</tr>\n";
    }
  }	
  echo '</table>';		
}

function delete_cdotw($id){
  $update = "UPDATE cdotw SET deleted ='yes' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo "'Error deleting the CD of the week from the database: ". $update ."<br>";
  } else {
    $cdotw = get_cdotw($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The CD of the Week entry for <span class=\"success\">". $cdotw['artist'] ." - ". $cdotw['title'] ."</span> has been deleted.</h3></div>";
  }
}

function display_cdotw($cdotw) {
  echo "<b>Artist: </b>" . $cdotw['artist'] .
    "<br><b>Title: </b>" . $cdotw['title'] .
    "<br><b>Label: </b>" . $cdotw['label'] .
    "<br><b>Review: </b>" . $cdotw['review'] .
    "<br><b>Cover Art:</b>".
    "<br><img src='". $cdotw['cd_pic_url']. "' width='200px'>".
    "<br><b>Band Url: </b>" . $cdotw['band'] .
    "<br><b>Reviewer: </b>" . $cdotw['reviewer'] .
    "<br><b>Date:</b>" . $cdotw['date'];
}

function get_cdotw($id) {
  $query = "SELECT * FROM cdotw where id=".$id;
  $result = mysql_query($query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysql_fetch_assoc($result);
}

function update_cdotw($id, $artist, $title, $label, $review, $cd_pic_url, $band, $reviewer, $date) {
  $artist = mysqli_real_escape_string($artist);
  $title = mysqli_real_escape_string($title);
  $label = mysqli_real_escape_string($label);
  $review = mysqli_real_escape_string($review);
  $cd_pic_url = mysqli_real_escape_string($cd_pic_url);
  $band = mysqli_real_escape_string($band);
  $reviewer = mysqli_real_escape_string($reviewer);
  $date = mysqli_real_escape_string($date);

  $update = "UPDATE cdotw SET artist=\"$artist\", title=\"$title\", label=\"$label\", review=\"$review\", cd_pic_url=\"$cd_pic_url\", band=\"$band\", reviewer=\"$reviewer\", date=\"$date\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result)
    echo 'There was an error updating: <br> '. $update;
  else
    return $result;
}

function validate_id($id) {
  $query = "SELECT id FROM cdotw WHERE id = ".$id;
  $result = mysql_query($query);

  if (!$result)
    return '';
  else
    return $id;
}

function view_all_cdotw(){
  $query = "SELECT * FROM cdotw WHERE deleted = 'no' ORDER BY date DESC LIMIT 64";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
    for ($i=1; $i<=mysql_num_rows($result);$i++) {
      $info = mysql_fetch_assoc($result);
      display_cdotw($info);
      echo '<br>[ <a href="cdotw_update.php?id=' .$info[id]. '">Edit</a> | <a href="cdotw_delete.php?id=' .$info[id]. '">Delete</a> ] <p>';
    }
  echo '</ol>';
}

?>
