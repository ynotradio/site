<?php

function add_ad($name, $start_date, $end_date, $pic_url, $web_url, $priority) {
  $name = mysqli_real_escape_string(open_db(), $name);
  $pic_url = mysqli_real_escape_string(open_db(), $pic_url);
  $web_url = mysqli_real_escape_string(open_db(), $web_url);

  $insert = "INSERT INTO ads VALUES (id, '".$name ."', '".$start_date. "', '". $end_date ."', '". $pic_url ."', '". $web_url ."', '". $priority ."', 'n')";

  $result = mysqli_query(open_db(), $insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New Ad for ". $name. " has been saved</h3>".
       "<hr width=75%>";
  display_ad(get_ad(mysqli_insert_id(open_db())));
  echo "</div>";
}

function current_ads_order() {
  $query = "SELECT * FROM ads WHERE deleted = 'n' AND start_date <= now() AND end_date >= now() ORDER BY priority";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<form action="ads_order.php" method="post">';
  for ($i=1; $i<=mysqli_num_rows($result);$i++) {
    $info = mysqli_fetch_assoc($result);
    echo "<div class=\"bottom-spacer_20\">
      Name: <b>" . $info['name']. "</b>
      <br>
      Priority: <input type=\"text\" class= \"input-xs\" value=\"".$info['priority']."\" name=\"".$info['id']."\">
      </div>";
  }
  echo "<input type=\"hidden\" name=\"action\" value=\"order\">
    <input type=\"submit\" class=\"btn-inverse\" value=\"Update Stories\">
    </form>";
}

function delete_ad($id){
  $update = "UPDATE ads set deleted ='y' where id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result) {
    echo "'Error deleting the ad from the database: ". $update ."<br>";
  } else {
    $ad = get_ad($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The ad for <span class=\"success\">". $ad['name'] ."</span> has been deleted.</h3></div>";
  }
}

function display_ad($ad) {
    echo "<b>Name:</b> ". $ad['name'].
    "<br><b>Start Date:</b> ". $ad['start_date'].
    "<br><b>End Date:</b> ". $ad['end_date'].
    "<br><b>Picture:</b><br> ".
    "<img src='". $ad['pic_url']. "' width='200px'>".
    "<br><b>Link:</b> ". $ad['web_url'].
    "<br><b>Priority:</b> ". $ad['priority'];
}

function get_ad($id) {
  $query = "SELECT * FROM ads where id=".$id;
  $result = mysqli_query(open_db(), $query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysqli_fetch_assoc($result);
}

function save_ad_order($id, $priority) {
  $update = "UPDATE ads set priority ='".$priority."' where id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }
}

function show_ads(){
  $query = "SELECT * FROM ads WHERE deleted = 'n' AND start_date <= now() AND end_date >= now() ORDER BY priority";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }
  if (mysqli_num_rows($result) > 0)
    echo "<div class=\"ads\">";

  for ($i=1; $i<=mysqli_num_rows($result);$i++)
  {
    $info = mysqli_fetch_assoc($result);
    echo "<a href=\"".$info['web_url']."\" target='_blank'><img src=\"".$info['pic_url']."\"></a>";
  }

  if (mysqli_num_rows($result) > 0)
    echo "</div>";
}

function update_ad($id, $name, $start_date, $end_date, $pic_url, $web_url, $priority) {
  $id = mysqli_real_escape_string(open_db(), $id);
  $start_date = mysqli_real_escape_string(open_db(), $start_date);
  $end_date = mysqli_real_escape_string(open_db(), $end_date);
  $name = mysqli_real_escape_string(open_db(), $name);
  $pic_url = mysqli_real_escape_string(open_db(), $pic_url);
  $web_url = mysqli_real_escape_string(open_db(), $web_url);
  $priority = mysqli_real_escape_string(open_db(), $priority);

  $update = "UPDATE ads SET start_date=\"$start_date\", end_date=\"$end_date\", name=\"$name\", pic_url=\"$pic_url\", web_url=\"$web_url\", priority=\"$priority\" WHERE id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function view_all_active_ads(){
  $query = "SELECT * FROM ads WHERE deleted = 'n' AND end_date >= now() ORDER BY priority";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysqli_num_rows($result);$i++)
  {
    $info = mysqli_fetch_assoc($result);
    display_ad($info);
      echo '<br>[ <a href="ad_update.php?id=' .$info[id]. '">Edit</a> | <a href="ad_delete.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

?>
