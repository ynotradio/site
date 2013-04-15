<?php

function add_custom_text($title, $html) {
  $permalink = create_permalink($title);

  $insert = "INSERT INTO custom_texts VALUES (id, '".$title ."', '".$permalink. "', '".$html. "', 'active')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New Custom Text has been saved</h3>".
       "<hr width=75%>";
  display_custom_text(get_custom_text(mysql_insert_id()));
  echo "</div>";
}

function create_permalink($title) {
  $permalink = strtolower($title);
  $permalink = str_replace(' ', '-', $permalink);

  if (!valid_permalink($permalink)) {
    $count = 0;
    do {
      $count = $count + 1;
      $temp_permalink = $permalink . '-' . $count;
    } while (valid_permalink($temp_permalink) == false);

    $permalink = $temp_permalink;
  }
  return $permalink;
}

function delete_custom_text($id) {
  $update = "UPDATE custom_texts SET status ='deleted' WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo "'Error deleting the custom text from the database: ". $update ."<br>";
  } else {
    $custom_text = get_custom_text($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The custom text <span class=\"success\">". $custom_text['title'] ."</span> has been deleted.</h3></div>";
  }
}

function display_custom_text($custom_text) {
  echo "<b>Title:</b> ". $custom_text['title'].
  "<br><b>Permalink:</b> ". $custom_text['permalink'].
  "<br><b>Url:</b> <a href=\"pages.php?page=".$custom_text['permalink']."\" target=\"_new\">http://www.ynotradio.net/pages.php?page=".$custom_text['permalink']."</a>".
  "<br><b>Copy:</b><br>". $custom_text['html'];
}

function display_custom_text_title_and_permalink($custom_text) {
  echo "<b>Title:</b> ". $custom_text['title'] .
       "<br><b>Permalink:</b> " . $custom_text['permalink'];
}

function find_custom_text_by_permalink($permalink) {
  $query = "SELECT * FROM custom_texts WHERE status = 'active' AND permalink = '".$permalink."'";
  $result = mysql_query($query);

  if ($result)
    return mysql_fetch_assoc($result);
}

function get_custom_text($id) {
  $query = "SELECT * FROM custom_texts WHERE status = 'active' AND id=".$id;
  $result = mysql_query($query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysql_fetch_assoc($result);
}

function update_custom_text($id, $title, $html) {
  $html = mysql_real_escape_string($html);
  $title = mysql_real_escape_string($title);

  $update = "UPDATE custom_texts SET title=\"$title\", html=\"$html\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function valid_permalink($permalink){
  $count = "SELECT count('permalink') AS 'permalink' FROM custom_texts WHERE permalink ='".$permalink."'";
  $result = mysql_query($count);

  $info = mysql_fetch_assoc($result);

  if ($info['permalink'] == '0')
    return true;
  else
    return false;
}

function view_all_custom_texts() {
  $query = "SELECT * FROM custom_texts WHERE status = 'active'";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysql_num_rows($result);$i++) {
    $info = mysql_fetch_assoc($result);
    display_custom_text_title_and_permalink($info);
    echo '<br>[ <a href="custom_text_update.php?id=' .$info[id]. '">Edit</a> | <a href="custom_text_delete.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

?>
