<?php

function view_all_cdotw(){
  $query = "SELECT * FROM cdotw WHERE deleted = 'no' ORDER BY date DESC";
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
      "<br><b>Artist: </b>". $info['artist'].
      "<br><b>Title: </b>". $info['title'].
      "<br><b>Label: </b>". $info['label'].
      "<br><b>Review: </b>". $info['review'].
      "<br><b>CD Picture: </b>". $info['cd_pic_url'].
      "<br><b>Band URL: </b>". $info['band'].
      "<br><b>Reviewer: </b>". $info['reviewer'].
      "<br><b>Date: </b>". $info['date'].
      '<br>[ <a href="editcdotw.php?id=' .$info[id]. '">Edit</a> | <a href="deletecdotw.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

function edit_cdotw($id) {
  $query = "SELECT * FROM cdotw where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }

  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Edit CD of The Week:</h3></center><p>';
  echo '<form action="savecdotw.php?id='.$info["id"].'" method="post">
    <table id="edit_cdotw" border="0">
    <tr>
    <td>Artist:</td>
    <td><input type="text" value="'.$info["artist"].'" name="artist" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Title:</td>
    <td><input type="text" value="'.$info["title"].'" name="title" maxlength="60" size="50"></td>
    </tr>
    <tr>
    <td>Label:</td>
    <td><input type="text" value="'.$info["label"].'" name="label" maxlength="60" size="50"></td>
    </tr>					
    <tr>
    <td>Review:</td>
    <td colspan="2"><textarea name="review" cols=60 rows=15>'. $info["review"].'</textarea></td>
    </tr>
    <tr>
    <td>CD Picture:</td>
    <td><input type="text" value="'.$info["cd_pic_url"].'" name="cd_pic_url" maxlength="115" size="90"></td>
    </tr>
    <tr>
    <td>Band URL:</td>
    <td><input type="text" value="'.$info["band"].'" name="band" maxlength="115" size="90"></td>
    </tr>
    <tr>
    <td>Reviewer:</td>
    <td><input type="text" value="'.$info["reviewer"].'" name="reviewer" maxlength="60" size="50"></td>
    </tr>
    <tr>
    <td>Date:</td>
    <td><input type="text" value="'.$info["date"].'" name="date" maxlength="60" size="50"></td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save CD of The Week"></td></tr>
    </table>
    </form>
    <p>** if the audio url is over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url';
}

function save_cdotw($id, $artist, $title, $label, $review, $cd_pic_url, $band, $reviewer, $date) {
  $artist = mysql_real_escape_string($artist);
  $title = mysql_real_escape_string($title);
  $label = mysql_real_escape_string($label);
  $review = mysql_real_escape_string($review);
  $cd_pic_url = mysql_real_escape_string($cd_pic_url);
  $band = mysql_real_escape_string($band);
  $reviewer = mysql_real_escape_string($reviewer);
  $date = mysql_real_escape_string($date);

  $update = "UPDATE cdotw SET artist=\"$artist\", title=\"$title\", label=\"$label\", review=\"$review\", cd_pic_url=\"$cd_pic_url\", band=\"$band\", reviewer=\"$reviewer\", date=\"$date\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h3>CD of The Week for " . $artist . " - ". $title. " has been saved</h3></center><br>";
}

function add_cdotw($artist, $title, $label, $review, $cd_pic_url, $band, $reviewer, $date) {
  $artist = mysql_real_escape_string($artist);
  $title = mysql_real_escape_string($title);
  $label = mysql_real_escape_string($label);
  $review = mysql_real_escape_string($review);
  $cd_pic_url = mysql_real_escape_string($cd_pic_url);
  $band = mysql_real_escape_string($band);
  $reviewer = mysql_real_escape_string($reviewer);	
  $date = mysql_real_escape_string($date);	

  $insert = "INSERT INTO cdotw VALUES (id, '".$artist ."', '".$title ."', '".$label ."', '".$review ."', '".$cd_pic_url ."', '".$band ."', '".$reviewer ."', '".$date ."', 'no')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p>The new review for ". $artist. " - ". $title. "has been saved.\n".
    "<p></center>\n";
}

function delete_cdotw($id){
  $update = "UPDATE cdotw SET deleted ='yes' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3> CD of The Week entry has been deleted.</h3></center><p>";
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

function validate_id($id) {
  $query = "SELECT id FROM cdotw WHERE id = ".$id;
  $result = mysql_query($query);

  if (!$result) {
    return '';
  }

  return $id;
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

?>
