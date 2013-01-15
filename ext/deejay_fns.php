<?php

function view_all_deejays(){
  $query = "SELECT * FROM deejays WHERE deleted = 'no' ORDER BY name";
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
      "<br><b>Name: </b>". $info['name'].
      "\n<br><b>Show: </b>". $info['show'].
      "\n<br><b>Email: </b>". $info['email'].
      "\n<br><b>External Connect Text: </b>". $info['external_connect_text'].
      "\n<br><b>External Connect URL: </b>". $info['external_connect_url'];				
    if ($info['pic'] != ""){
      echo "\n<br><b>Deejay Picture: </b><br> <img src=\"". $info['pic']. "\" height='150px';>\n";
    } else {
      echo "\n<br><b>Picture: </b><br> <img src=\"/imgs/na.jpg\" height='100px';>\n";
    }
    echo '<br>[ <a href="editdeejay.php?id=' .$info[id]. '">Edit</a> | <a href="deletedeejay.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
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

function edit_deejay($id) {
  $query = "SELECT * FROM deejays where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Edit Deejay: ' .deejayname($id). '</h3></center><p>';

  echo '<form action="savedeejay.php?id='.$info["id"].'" method="post">
    <table id="edit_deejay" border="0">
    <tr>
    <td>Name:</td>
    <td><input type="text" value="'.$info["name"].'" name="name" maxlength="55" size="32"></td>
    </tr>
    <tr>
    <td>Show:</td>
    <td><input type="text" value="'.$info["show"].'" name="show" maxlength="55" size="32"></td>
    </tr>
    <tr>
    <td>Email:</td>
    <td><input type="text" value="'.$info["email"].'" name="email" maxlength="55" size="32"></td>
    </tr>				
    <tr>
    <td>External Connect Text:</td>
    <td><input type="text" value="'.$info["external_connect_text"].'" name="external_connect_text" maxlength="55" size="32"></td>
    </tr>
    <tr>
    <td>External Connect URL:</td>
    <td><input type="text" value="'.$info["external_connect_url"].'" name="external_connect_url" maxlength="120" size="64"></td>
    </tr>
    <tr>
    <td>Picture:</td>
    <td><input type="text" value="'.$info["pic"].'" name="pic" maxlength="55" size="32"></td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save Deejay"></td></tr>
    </table>
    </form>
    <p>** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url';
}

function add_deejay($name, $show, $email, $external_connect_text, $external_connect_url, $pic) {
  if (!get_magic_quotes_gpc()){
    $name = addslashes($name);
    $show = addslashes($show);
    $email = addslashes($email);
    $external_connect_text = addslashes($external_connect_text);
    $external_connect_url = addslashes($external_connect_url);
    $pic = addslashes($pic);
  }

  $insert = "INSERT INTO deejays VALUES (id, '".$name ."', '".$show. "', '".$email. "', '".$external_connect_text. "', '". $external_connect_url ."', '". $pic ."', '1', 'no')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "\n<br><hr width=75%>".
    "\n<br><b>Name:</b> ". $name.
    "\n<br><b>Show:</b> ". $show.
    "\n<br><b>Email:</b> ". $email.
    "\n<br><b>External Connect Text:</b> ". $external_connect_text.
    "\n<br><b>External Connect URL:</b> ". $external_connect_url.
    "\n<br><b>Picture:</b> ". $pic.
    "<p></center>\n";
}

function save_deejay($id, $name, $show, $email, $external_connect_text, $external_connect_url, $pic) {
  if (!get_magic_quotes_gpc()){
    $name = addslashes($name);
    $show = addslashes($show);
    $email = addslashes($email);
    $external_connect_text = addslashes($external_connect_text);
    $external_connect_url = addslashes($external_connect_url);
    $pic = addslashes($pic);
  }

  $update = "UPDATE deejays SET name=\"$name\", `show`=\"$show\", email=\"$email\", external_connect_text=\"$external_connect_text\",external_connect_url=\"$external_connect_url\", pic=\"$pic\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h3>Deajay (". deejayname($id) . ") has been saved</h3></center><br>";

}

function delete_deejay($id){
  $update = "UPDATE deejays SET deleted ='yes' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>". deejayname($id) . " has been deleted.</h3></center><p>";

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

function display_deejay($deejays){
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
    echo "<div><a href=\"mailto:".$info['email']."\">E-Mail </a></div>\n";
    if ($info['external_connect_text'] && $info['external_connect_url'])
      echo "<div><a href=\"" . $info['external_connect_url'] ."\" target=_new>". $info['external_connect_text'] . "</a></div>\n";
    echo "</div>";    
  }
}

?>
