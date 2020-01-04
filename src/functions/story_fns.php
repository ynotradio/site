<?php

function add_story($headline, $story, $start_date, $end_date, $pic, $pic_url, $priority) {
  $headline = mysqli_real_escape_string(open_db(), $headline);
  $story = mysqli_real_escape_string(open_db(), $story);

  $insert = "INSERT INTO stories VALUES (id, '".$start_date ."', '".$end_date. "', '". $headline ."', '". $story ."', '". $pic ."', '". $pic_url ."', '". $priority ."', 'n')";
  $result = mysqli_query(open_db(), $insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New Story about ". $headline. ", has been saved</h3>".
       "<hr width=75%>";
  display_story(get_story(mysqli_insert_id(open_db())));
  echo "</div>";
}

function current_order() {
  $query = "SELECT * FROM stories WHERE deleted = 'n' AND end_date >= now() ORDER BY priority";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<form action="stories_order.php" method="post">';
  for ($i=1; $i<=mysqli_num_rows($result);$i++) {
    $info = mysqli_fetch_assoc($result);
    echo "<div class=\"bottom-spacer_20\">
      Headline: <b>" . $info['headline']. "</b>
      <br>
      Priority: <input type=\"text\" class= \"input-xs\" value=\"".$info['priority']."\" name=\"".$info['id']."\">
      </div>";
  }
  echo "<input type=\"hidden\" name=\"action\" value=\"order\">
    <input type=\"submit\" class=\"btn-inverse\" value=\"Update Stories\">
    </form>";
}

function delete_story($id){
  $update = "UPDATE stories SET deleted ='y' where id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result) {
    echo "'Error deleting the stories from the database: ". $update ."<br>";
  } else {
    $story = get_story($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The story <span class=\"success\">". $story['headline'] ."</span> has been deleted.</h3></div>";
  }
}

function display_pic($pic_url, $pic_img) {
  if ($pic_url == "top11.php") {
    echo "<a href= \"". $pic_url . "\" ><img src=\"" . $pic_img . "\"></a>\n";
  } else {
    echo "<a href= \"". $pic_url . "\" target=_new ><img src=\"" . $pic_img . "\"></a>\n";
  }
}

function display_stories($stories) {
  for ($i=0; $i < sizeof($stories);$i++)
  {
    $info = $stories[$i];
    echo "<div class=\"feature-box\">" .
      "<h3>". $info['headline']. "</h3>\n";
    display_pic($info['pic_url'], $info['pic']);
    echo "<div class=\"clearfix\">" .$info['story'] . "</div>\n</div>";
  }
}

function display_story($story) {
     echo "<br><b>Headline: </b>". $story['headline'].
      "<br><b>Story: </b>". $story['story'].
      "<br><b>Start Date: </b>". $story['start_date'].
      "<br><b>End Date: </b>". $story['end_date'].
      "<br><b>Picture URL: </b>". $story['pic'].
      "<br><b>Picture Link URL: </b>". $story['pic_url'].
      "<br><b>Priority: </b>". $story['priority'];
}

function get_stories($amount){
  $query = "SELECT * FROM stories WHERE deleted = 'n' AND start_date <= now() AND end_date >= now() ORDER BY priority";

  $limit = ($amount == "all") ? "" : " LIMIT ". $amount;
  $query = $query . $limit;

  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }
  $odd_results = array();
  $even_results = array();

  for ($i=1; $i <= mysqli_num_rows($result); $i++){
    $info = mysqli_fetch_assoc($result);
    if (fmod($i,2) == 0) {
      array_push($even_results , $info);
    } else {
      array_push($odd_results , $info);
    }
  }

  return array($odd_results, $even_results);
}

function get_story($id) {
  $query = "SELECT * FROM stories where id=".$id;
  $result = mysqli_query(open_db(), $query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysqli_fetch_assoc($result);
}

function save_order($id, $priority) {
  $update = "UPDATE stories set priority ='".$priority."' where id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }
}

function update_story($id, $headline, $story, $start_date, $end_date, $pic, $pic_url, $priority) {
  $id = mysqli_real_escape_string(open_db(), $id);
  $start_date = mysqli_real_escape_string(open_db(), $start_date);
  $end_date = mysqli_real_escape_string(open_db(), $end_date);
  $headline = mysqli_real_escape_string(open_db(), $headline);
  $story = mysqli_real_escape_string(open_db(), $story);
  $priority = mysqli_real_escape_string(open_db(), $priority);
  $pic = mysqli_real_escape_string(open_db(), $pic);
  $pic_url = mysqli_real_escape_string(open_db(), $pic_url);

  $update = "UPDATE stories SET start_date=\"$start_date\", end_date=\"$end_date\", headline=\"$headline\", story=\"$story\", pic=\"$pic\", pic_url=\"$pic_url\", priority=\"$priority\" WHERE id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function view_all_stories(){
  $query = "SELECT * FROM stories WHERE deleted = 'n' AND end_date >= now() ORDER BY priority";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysqli_num_rows($result);$i++)
  {
    $info = mysqli_fetch_assoc($result);
    display_story($info);
    echo '<br>[ <a href="story_update.php?id=' .$info[id]. '">Edit</a> | <a href="story_delete.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

?>
