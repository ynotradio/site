<?php

function add_deejay($name, $show, $email, $external_connect_text, $external_connect_url, $pic) {
  $name = mysql_real_escape_string($name);
  $show = mysql_real_escape_string($show);
  $email = mysql_real_escape_string($email);
  $external_connect_text = mysql_real_escape_string($external_connect_text);
  $external_connect_url = mysql_real_escape_string($external_connect_url);
  $pic = mysql_real_escape_string($pic);

  $insert = "INSERT INTO deejays VALUES (id, '".$name ."', '".$show. "', '".$email. "', '".$external_connect_text. "', '". $external_connect_url ."', '". $pic ."', '1', 'no')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New Deejay, ". $name. ", has been saved</h3>".
       "<hr width=75%>";
  display_deejay(get_deejay(mysql_insert_id()));
  echo "</div>";
}

function deejay_name($id) {
  $query = "SELECT name FROM deejays where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }

  $info = mysql_fetch_assoc($result);

  return $info['name'];
}

function delete_deejay($id){
  $update = "UPDATE deejays SET deleted ='yes' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo "'Error deleting the deejay from the database: ". $update ."<br>";
  } else {
    $deejay = get_deejay($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The deejay <span class=\"success\">". $deejay['name'] ."</span> has been deleted.</h3></div>";
  }
}

function display_deejay($deejay) {
  echo "<b>Name:</b> ". $deejay['name'].
  "<br><b>Show:</b> ". $deejay['show'].
  "<br><b>Email:</b> ". $deejay['email'].
  "<br><b>External Connect Text:</b> ". $deejay['external_connect_text'].
  "<br><b>External Connect URL:</b> ". $deejay['external_connect_url'];
    if ($deejay['pic'] != "")
      echo "<br><b>Deejay Picture:</b><br><img src=\"". $deejay['pic']. "\" height='150px';>\n";
    else
      echo "<br><b>Deejay Picture:</b><br> <img src=\"/imgs/na.jpg\" height='100px';>\n";
}

function display_all_deejays($deejays){
  for ($i=0; $i < sizeof($deejays);$i++)
  {
    $info = $deejays[$i];
    echo "<div class=\"deejay\">".
      "<img src=\"". $info['pic']. "\" width='150px';>\n".
      "<h2>" . $info['name']. "</h2>\n";
    if ($info['name'] == "Josh T. Landow")
      echo "Josh has been with the Y for many years now dating back to his days as an intern at Y100 in 1997. Josh went on to be a weekend/fill-in DJ at Y100 as well as the Promotions Director until the station went off the air in February 2005. He then carried the brand on with Jim McGuinn as Y100 Rocks before partnering with another radio station until July 2010. Now Josh has gone indie again with Y-Not Radio - Philadelphia's Real Alternative!";
    if ($info['show'])
      echo "<div class=\"show_title\">" . $info['show']. "</div>\n";
    echo "<div><a href=\"mailto:".$info['email']."\">E-Mail</a></div>\n";
    if ($info['external_connect_text'] && $info['external_connect_url'])
      echo "<div><a href=\"" . $info['external_connect_url'] ."\" target=_new>". $info['external_connect_text'] . "</a></div>\n";
    echo "</div>";
  }
}

function get_deejay($id) {
  $query = "SELECT * FROM deejays where id=".$id;
  $result = mysql_query($query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysql_fetch_assoc($result);
}

function get_deejays() {
  $josh_query = "SELECT * FROM deejays WHERE deleted = 'no' AND name = 'Josh T. Landow' ORDER BY name";
  $josh_result = mysql_query($josh_query);

  if (!$josh_result) {
    echo "error: ". $josh_query;
    die('Invalid');
  }

  $query = "SELECT * FROM deejays WHERE deleted = 'no' AND name != 'Josh T. Landow' ORDER BY sort, name";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  $josh = array(mysql_fetch_assoc($josh_result));
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

  return array($josh, $odd_results, $even_results);
}

function update_deejay($id, $name, $show, $email, $external_connect_text, $external_connect_url, $pic) {
  $name = mysql_real_escape_string($name);
  $show = mysql_real_escape_string($show);
  $email = mysql_real_escape_string($email);
  $external_connect_text = mysql_real_escape_string($external_connect_text);
  $external_connect_url = mysql_real_escape_string($external_connect_url);
  $pic = mysql_real_escape_string($pic);

  $update = "UPDATE deejays SET name=\"$name\", `show`=\"$show\", email=\"$email\", external_connect_text=\"$external_connect_text\",external_connect_url=\"$external_connect_url\", pic=\"$pic\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result)
    echo "There was an error updaing: <br>" . $update;
  else
    return $result;
}

function view_all_deejays(){
  $query = "SELECT * FROM deejays WHERE deleted = 'no' ORDER BY name";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysql_num_rows($result);$i++) {
    $info = mysql_fetch_assoc($result);
    display_deejay($info);
    echo '<br>[ <a href="deejay_update.php?id=' .$info[id]. '">Edit</a> | <a href="deejay_delete.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

?>
