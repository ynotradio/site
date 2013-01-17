<?php

function view_all_stories(){
  $query = "SELECT * FROM stories WHERE deleted = 'n' AND end_date >= now() ORDER BY priority";
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
      "<br><b>Headline: </b>". $info['headline'].
      "<br><b>Story: </b>". $info['story'].
      "<br><b>Start Date: </b>". $info['start_date'].
      "<br><b>End Date: </b>". $info['end_date'].
      "<br><b>Picture URL: </b>". $info['pic'].
      "<br><b>Picture Link URL: </b>". $info['pic_url'].
      "<br><b>Priority: </b>". $info['priority'].
      '<br>[ <a href="editstory.php?id=' .$info[id]. '">Edit</a> | <a href="deletestory.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

function edit_story($id) {
  $query = "SELECT * FROM stories where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h1>Edit Story: '.$info["headline"].'</h1></center><p>';


  echo '<form action="savestory.php?id='.$info["id"].'" method="post">
    <table id="edit_story" border="0">
    <tr>
    <td>Headline:</td>
    <td colspan="2"><input type="text" value="'.$info["headline"].'" name="headline" maxlength="55" size="45"></td>
    </tr>
    <tr>
    <td>Story:</td>
    <td colspan="2"><textarea name="story" cols=40 rows=10>'. $info["story"].'</textarea></td>
    </tr>
    <tr>
    <td>Start Date:</td>
    <td><input type="text" value="'.$info["start_date"].'" name="start_date" maxlength="25" size="25"></td>
    <td>Format: yyyy-mm-dd</td>
    </tr>
    <tr>
    <td>End Date:</td>
    <td><input type="text" value="'.$info["end_date"].'" name="end_date" maxlength="25" size="25"></td>
    <td>Format: yyyy-mm-dd</td>
    </tr>
    <tr>
    <td>Picture:</td>
    <td colspan="2"><input type="text" value="'.$info["pic"].'" name="pic" maxlength="120" size="64"></td>
    </tr>
    <tr>
    <td>Picture Link URL:</td>
    <td colspan="2"><input type="text" value="'.$info["pic_url"].'" name="pic_url" maxlength="120" size="64"></td>
    </tr>
    <tr>
    <td>Priority:</td>
    <td colspan="2"><input type="text" value="'.$info["priority"].'" name="priority" maxlength="5" size="5"></td>
    </tr>
    <tr><td colspan="3">
    <input type="submit" value="Save Story"></td>
    </tr>
    </table>
    </form>
    <p>** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url';
}

function save_story($id, $start_date, $end_date, $headline, $story, $pic, $pic_url, $priority) {
  $id = mysql_real_escape_string($id);
  $start_date = mysql_real_escape_string($start_date);
  $end_date = mysql_real_escape_string($end_date);
  $headline = mysql_real_escape_string($headline);
  $story = mysql_real_escape_string($story);
  $priority = mysql_real_escape_string($priority);
  $pic = mysql_real_escape_string($pic);
  $pic_url = mysql_real_escape_string($pic_url);

  $update = "UPDATE stories SET start_date=\"$start_date\", end_date=\"$end_date\", headline=\"$headline\", story=\"$story\", pic=\"$pic\", pic_url=\"$pic_url\", priority=\"$priority\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }
}

function add_story($start_date, $end_date, $headline, $story, $pic, $pic_url, $priority) {
  $headline = mysql_real_escape_string($headline);
  $story = mysql_real_escape_string($story);

  $insert = "INSERT INTO stories VALUES (id, '".$start_date ."', '".$end_date. "', '". $headline ."', '". $story ."', '". $pic ."', '". $pic_url ."', '". $priority ."', 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>". $headline. "</h3></center><p>".
    "<br><hr width=75%>".
    "<br><b>Headline:</b> ". $headline.
    "<br><b>Story:</b> ". $story.
    "<br><b>Start Date:</b> ". $start_date.
    "<br><b>End Date:</b> ". $end_date.
    "<br><b>Picture:</b> ". $pic.
    "<br><b>Picture Link URL:</b> ". $pic_url.
    "<br><b>Priority:</b> ". $priority.
    "<p>";
}

function get_headline($id) {
  $select = "SELECT * FROM stories where id=".$id;
  $result = mysql_query($select);

  if (!$result) {
    echo $select ."<br>";
    die('Error Getting Database Entry.');
  }

  $info = mysql_fetch_assoc($result);

  return $info['headline'];
}

function delete_story($id){
  $update = "UPDATE stories set deleted ='y' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>". getheadline($id) . " has been deleted.</h3></center><p>";
}

function order_stories() {
  $query = "SELECT * FROM stories WHERE deleted = 'n' AND end_date >= now() ORDER BY priority";
  $result = mysql_query($query);
  $ids = array();

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<form action="saveorder.php" method="post">
    <table id="edit_story" border="0">';
  for ($i=1; $i<=mysql_num_rows($result);$i++) {
    $info = mysql_fetch_assoc($result);
    echo
      '<tr>
      <td>Headline:</td>
      <td>' .$info["headline"]. '</td>
      </tr>
      <tr>
      <td>Priority:</td>
      <td><input type="text" value="'.$info["priority"].'" name="'.$info["id"].'" maxlength="5" size="15"></td>
      </tr>';
  }
  echo '<tr>
    <td colspan="2">
    <input type="submit" value="Save Order"></td>
    </tr>
    </table>
    </form>';
}

function save_order($id, $priority) {
  $update = "UPDATE stories set priority ='".$priority."' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }	
}

function get_stories($amount){
  $query = "SELECT * FROM stories WHERE deleted = 'n' AND end_date >= now() ORDER BY priority";

  $limit = ($amount == "all") ? "" : " LIMIT ". $amount;
  $query = $query . $limit;

  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }
  $odd_results = array();
  $even_results = array();

  for ($i=1; $i <= mysql_num_rows($result); $i++){
    $info = mysql_fetch_assoc($result);
    if (fmod($i,2) == 0) {
      array_push($even_results , $info);
    } else {
      array_push($odd_results , $info);
    }
  }

  return array($odd_results, $even_results);
}

function display_stories($stories) {
  for ($i=0; $i < sizeof($stories);$i++)
  {
    $info = $stories[$i];
    echo "<div class=\"feature-box\">" .
      "<h3>". $info['headline']. "</h3>\n";
    display_pic($info['pic_url'], $info['pic']);
    echo "<div>" .$info['story'] . "</div>\n</div>";
  }
}

function display_pic($pic_url, $pic_img) {
  if ($pic_url == "top11.php") {
    echo "<a href= \"". $pic_url . "\" ><img src=\"" . $pic_img . "\"></a>\n";
  } else {
    echo "<a href= \"". $pic_url . "\" target=_new ><img src=\"" . $pic_img . "\"></a>\n";
  }
}
?>
