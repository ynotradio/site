<?php

function top11() {
  $query = "SELECT * FROM top11";
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }

  echo '<center><h1>Top 11 @ 11</h1></center><p>';
  echo '<form action="savetop11.php" method="post">
    <table id="top11_edit">

    <tr><th>Number</th><th>Artist</th><th>Song</th><th>Note</th></tr>';
  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    if ($info['placement'] != 99 && $info['placement'] != 98) {
      echo "<tr>\n" .
        "<td>" .  $info['placement'] . "</td>\n" .
        "<td> <input type=\"text\" value=\"" .$info['artist']. "\" name=\"artist_".$i."\" maxlength=\"64\" size=\"25\"></td>\n".
        "<td> <input type=\"text\" value=\"" .$info['song']. "\" name=\"song_".$i."\" maxlength=\"64\" size=\"25\"></td>\n".
        "<td> <input type=\"text\" value=\"" .$info['note']. "\" name=\"note_".$i."\" maxlength=\"64\" size=\"25\"></td>\n".
        "</tr>\n";
    } else {
      echo "<tr>\n" .
        "<td><b>Date:</b></td>\n".
        "<td> <input type=\"text\" value=\"" .$info['artist']. "\" name=\"date\" maxlength=\"25\" size=\"25\"></td>\n".
        "<td></td>\n" .
        "</tr>\n";
    }			
  }

  echo "<tr><td colspan=\"4\">\n" .
    "<input type=\"submit\" value=\"Save Top 11 @ 11\"></td></tr>\n" .		
    "</table>\n" .
    "</form>\n";
}

function show_top11() {
  $query = "SELECT * FROM top11";
  $result = mysql_query($query);
  $title = "SELECT artist FROM top11 where placement = 99";
  $result_title = mysql_query($title);

  if (!$result || !$result_title) {
    die('No results in database.');
  }

  $title_output = mysql_fetch_assoc($result_title);
  echo "<h2 class=\"center\">Top 11 @ 11 for ". $title_output['artist']. "</h2>\n";

  echo "<table class='table table-striped table-bordered-horizontal table-condensed no-header table-center'>";

  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    if ($info['placement'] != 99 && $info['placement'] != 98) {
      echo "<tr>\n<td>" .  $info['placement'] . " </td>\n" .
        "<td>".$info['artist'] . "</td>\n".
        "<td>" .$info['song']. "</td>\n".
        "<td>" .$info['note']. "</td>\n".
        "</tr>\n";
    }		
  }		
  echo "</table>\n";
}

function save_top11($placement, $artist, $song, $note){
  $artist = mysql_real_escape_string($artist);
  $song = mysql_real_escape_string($song);
  $note = mysql_real_escape_string($note);

  $update = 'UPDATE top11 SET artist =\''.$artist .'\', song=\''.$song . '\', note=\''.$note. '\' WHERE placement='.$placement;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database. Code: 83');
  }		
}

function save_top11_date($date){
  $date = mysql_real_escape_string($date);

  $update = 'UPDATE top11 SET artist =\''.$date .'\' WHERE placement=99';
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database. Code: 98');
  }			
}

function add_top11_song($artist, $song) {
  $artist = mysql_real_escape_string($artist);
  $song = mysql_real_escape_string($song);

  $insert = "INSERT INTO top11songs VALUES (id, '".$artist ."', '".$song. "', 0, 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<br><hr width=75%>".
    "<br><b>Artist:</b> ". $artist.
    "<br><b>Song:</b> ". $song.
    "<p>";
}

function edit_top11_song($id) {
  $query = "SELECT * FROM top11songs where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h1>Edit Top 11 Song:</h1></center><p>';
  echo '<form action="savetop11song.php?id='.$info["id"].'" method="post">
    <table id="edit_top11song" border="0">
    <tr>
    <td>Artist:</td>
    <td><input type="text" value="'.$info["artist"].'" name="artist" maxlength="55" size="45"></td>
    </tr>
    <tr>
    <td>Song:</td>
    <td><input type="text" value="'.$info["song"].'" name="song" maxlength="55" size="45"></td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save Top 11 Song"></td>
    </tr>
    </table>
    </form>';
}

function view_all_top11_songs() {
  $query = "SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY artist";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo "<table id='top11'>";
  echo "<tr><th>Arist</th><th>Song</th><th colspan='2'>Actions</th></tr>";

  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    if (fmod($i,2) == 1) {	
      echo "<tr class=\"d0\">\n";
    } else {
      echo "<tr class=\"d1\">\n";
    }
    echo "<td>".$info['artist'] . "</td>\n".
      "<td>" .$info['song']. "</td>\n".
      "<td><a href=\"edittop11song.php?id=" .$info[id]. "\">Edit</a></td>\n".
      "<td><a href=\"deletetop11song.php?id=" .$info[id]. "\">Delete</a></td>\n".
      "</tr>\n";	
  }		
  echo "</table>\n";
}

function save_top11_song($id, $artist, $song) {
  $artist = mysql_real_escape_string($artist);
  $song = mysql_real_escape_string($song);

  $update = "UPDATE top11songs SET artist=\"$artist\", song=\"$song\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database. Code: 191');
  }
}

function get_top11_artist_song($id) {
  $select = "SELECT * FROM top11songs where id=".$id;
  $result = mysql_query($select);

  if (!$result) {
    echo $select ."<br>";
    die('Error Getting Database Entry.');
  }

  $info = mysql_fetch_assoc($result);

  return $info['artist'] . " - " . $info['song'];
}

function delete_top11_song($id){

  $update = "UPDATE top11songs set deleted ='y' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database. Code: 216');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>". gettop11artist_song($id) . " has been deleted.</h3></center><p>";
}

function stats() {

  $select = "SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY value DESC";
  $result = mysql_query($select);

  if (!$result) {
    die('error updating database. Code: 229');
  }
  echo "<table id='top11'>";
  echo "<tr><th>Spot</th><th>Arist</th><th>Song</th><th>Value</th></tr>";
  $top = 0;

  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $top++;
    $info = mysql_fetch_assoc($result);
    if (fmod($i,2) == 1) {	
      echo "<tr class=\"d0\">\n";
    } else {
      echo "<tr class=\"d1\">\n";
    }
    echo "<td>" .$i . "</td>\n".
      "<td>".$info['artist'] . "</td>\n".
      "<td>" .$info['song']. "</td>\n".
      "<td>" .$info['value']. "</td>\n".
      "</tr>\n";	
    if ($top == 11) {
      echo "<tr><td colspan='4'> <hr> </td></tr>";
    }
  }		
  echo "</table>\n";
}	

function nuke() {
  $update = "UPDATE top11songs SET value = 0";
  $result = mysql_query($update);

  if (!$result) {
    die('error updating database. Code: 261');
  }
  echo "<center><br>Top 11 Stats - <b>NUKED</b>";

  $update = "UPDATE write_in SET deleted = 'yes'";
  $result = mysql_query($update);

  if (!$result) {
    die('error updating database. Code: 269');
  }
  echo "<br>Top 11 Write-ins - <b>NUKED</b>";

  $update = "UPDATE top11contest SET display = 'no'";
  $result = mysql_query($update);

  if (!$result) {
    die('error updating database. Code: 277');
  }
  echo "<br>Top 11 Contestants - <b>NUKED</b>";

  $update = "UPDATE ip_address SET deleted = 'yes'";
  $result = mysql_query($update);

  if (!$result) {
    die('error updating database. Code: 285');
  }
  echo "<br>IP Addresses - <b>NUKED</b></center>";

}

function display_form() {
  open_db();
  $select = "SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY artist";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<h2 class=\"center\">Vote for Your Top 3 Y-Not Songs of the Week</h2>\n";
  echo "<form action=\"top11.php\" method=\"post\" name=\"top11\" class=\"form-default\">
    <table class=\"top11-picks control-group\">\n".
    "<col> <col width=\"320\">";

  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    if (fmod($i,2) == 1) {	
      echo "<tr>\n";
    }
    echo "<td class=\"controls\"><label for=\"".$info['id']."\"><input type=\"checkbox\" name=\"top11[]\" id=\"".$info['id']."\" value=\"".$info['id']."\">".
      "<span class=\"top11_entry\"> ".$info['artist'] ." - ".$info['song'] ."</span>\n</label>\n</td>\n";
  }
  if (fmod($i,2) == 1) {	
    echo "</tr>\n";
  }
  echo "<tr><td colspan=\"2\"><input type=\"checkbox\" id=\"top11_write_in\"> <input type=\"text\" disabled=\"disabled\" class=\"input-xl\" id=\"write_in_value\" name=\"write_in_value\"></td>\n</tr>\n".
       "<td class=\"form-other\">Other (please specify)</td>\n</tr>\n<tr>\n";
  echo "<tr>\n" .
        "<td>First name:<input type=\"text\" name=\"firstname\" class=\"input-l\"/></td></tr>".
        "<tr>\n<td>Last name:</td>\n<tr>\n<td><input type=\"text\" name=\"lastname\" class=\"input-l\"/></td>\n</tr>\n".
        "<tr>\n<td>E-mail:</td>\n<tr>\n<td><input type=\"text\" name=\"email\" class=\"input-l\"/></td>\n</tr\n>".
        "<tr>\n<td>Phone #:</td>\n<tr>\n<td><input type=\"text\" name=\"phone\" class=\"input-l\"/></td>\n</tr>\n".
        "<tr>\n<td colspan=2>Would you like to be entered into this week's contest?</td>\n</tr>\n".
        "<tr><td class=\"controls inline\"><label for=\"yes\"><input type=\"radio\" name=\"contest\" id=\"yes\" value=\"yes\" />Yes</label>".
        "<label for=\"no\"><input type=\"radio\" name=\"contest\" id=\"no\" value=\"no\" />No</label></td>\n</tr>\n".
        "<tr>\n<td colspan=2>Would you like to receive Y-Not Radio's weekly Y-Mail newsletter?</td>\n</tr>\n".
        "<tr><td class=\"controls inline\"><label for=\"newsletter-yes\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-yes\" value=\"yes\" />Yes</label>".
        "<label for=\"newsletter-no\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-no\" value=\"no\" />No</label>".
        "<label for=\"newsletter-already\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-already\" value=\"already\" />I Already Receive It</label></td>\n</tr>\n".
        "<tr><td class=\"form-actions\"><button class=\"btn-info\" type=\"submit\">Cast Your Vote</button></td></tr>\n" .
        "<tr><td><input type=\"hidden\" name=\"action\" value=\"write\"></td></tr>".
      "</table>\n" .
    "</form>\n"; 	
}	

function display_message() {
  open_db();	
  $select = "SELECT * FROM top11message WHERE id = '1'";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  $info = mysql_fetch_assoc($result);
  echo "<div class=\"top11-message full_height\"><img src=\"imgs/knob_11.jpg\" alt=\"Top 11\" /></td>\n<td id=\"top11message\">" . $info['message'] . "</div>";

}

function add_top11_plus1($id){
  $update = "UPDATE top11songs SET value = value + 1  WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    die('error updating database. Code: 353');
  }
}

function add_contestant($firstname, $lastname, $email, $phone, $contest, $newsletter) {
  $insert = "INSERT INTO top11contest VALUES (id, '".$firstname ."', '".$lastname. "', '".$email. "', '".$phone. "', '".$contest. "', '".$newsletter. "', 'yes')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert;
    echo 'Error Inserting into Database.';
  }
}

function top11_contestant_count() {
  $select = "SELECT * FROM top11contest WHERE display = 'yes'";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  return "(" .mysql_num_rows($result) ." total entries)";
}

function pick_a_winner() {
  $select = "SELECT * FROM top11contest WHERE display = 'yes' ORDER BY RAND() LIMIT 1";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  $info = mysql_fetch_assoc($result);
  echo "<b>First name: </b>" . $info['firstname'] . "<br>".
    "<b>Last name: </b>" . $info['lastname'] . "<br>".
    "<b>Email: </b>" . $info['email'] . "<br>".
    "<b>Phone: </b>" . $info['phone'] . "<br>";
}

function see_contestants() {
  $select = "SELECT * FROM top11contest WHERE display = 'yes' ORDER BY id";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }

  for ($i=1; $i<=mysql_num_rows($result);$i++) {
    echo "<ol>";
    $info = mysql_fetch_assoc($result);
    echo
      "<br><b>First name: </b>". $info['firstname'].
      "<br><b>Last Name: </b>". $info['lastname'].
      "<br><b>Email: </b>". $info['email'].
      "<br><b>Phone: </b>". $info['phone'].
      "<br><b>Newsletter: </b>". $info['newsletter'] . "</ol>";
  }
}

function check_ip($ip) {
  open_db();	
  $can_vote = "true";
  $select = "SELECT * FROM ip_address WHERE address = '$ip' AND deleted = 'n'";
  $result = mysql_query($select);
  $info = mysql_fetch_assoc($result);
  if ($info['address']) {
    $can_vote = "false";
    return $can_vote;
  } else {
    add_ip($ip);	
    return $can_vote;
  }
}

function add_ip($ip) {
  $insert = "INSERT INTO ip_address VALUES (id, '".$ip ."', 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

}

function export() {
  $select = "SELECT * FROM top11contest WHERE contest =  'yes' AND display = 'yes' ORDER BY id";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<table id=\"top11\">\n<tr>\n<th colspan=2>Name</th><th>Email</th><th>Phone</th><th>Newsletter</th></tr>\n";
  for ($i=1; $i<=mysql_num_rows($result);$i++) {

    $info = mysql_fetch_assoc($result);
    echo
      "<tr><td>". $info['firstname']. "</td>".
      "<td>". $info['lastname']."</td>".
      "<td>". $info['email']."</td>".
      "<td>". $info['phone']."</td>".
      "<td>". $info['newsletter']."</td></tr>";
  }
  echo "</table>"	;
}

function export_newsletter() {
  $select = "SELECT * FROM top11contest WHERE contest = 'no' AND newsletter = 'yes' AND display = 'yes' ORDER BY id";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<table id=\"top11\">\n<tr>\n<th colspan=2>Name</th><th>Email</th></tr>\n";
  for ($i=1; $i<=mysql_num_rows($result);$i++) {

    $info = mysql_fetch_assoc($result);
    echo
      "<tr><td>". $info['firstname']. "</td>".
      "<td>". $info['lastname']."</td>".
      "<td>". $info['email']."</td></tr>";
  }
  echo "</table>"	;
}

function edit_top11_message() {
  $query = "SELECT * FROM top11message where id=1";
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h1>Edit Top 11 Message:</h1></center><p>';


  echo '<form action="savetop11message.php" method="post">
    <table id="edit_top11message" border="0">
    <tr>
    <td>Message:</td>
    <td><textarea name="message" cols=40 rows=10>'. $info["message"].'</textarea></td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save Top 11 Message"></td>
    </tr>
    </table>
    </form>';
}

function save_top11_message($message){
  $message = mysql_real_escape_string($message);

  $update = 'UPDATE top11message SET message =\''.$message .'\' WHERE id=1';
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database. Code: 517');
  }			
}

function write_in($write_in) {
  $insert = "INSERT INTO write_in VALUES (id, '".$write_in ."', 'no')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

}

function view_write_ins() {
  $select = "SELECT * FROM write_in WHERE deleted = 'no' ORDER BY id";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<ol>";
  for ($i=1; $i<=mysql_num_rows($result);$i++) {

    $info = mysql_fetch_assoc($result);
    echo "<li>" .$info['write_in']. "</li>";
  }
  echo "</ol>";	
}

function open_top11() {
  $update = 'UPDATE top11 SET artist ="open" WHERE placement=98';
  $result = mysql_query($update);

  if (!$result) {
    die('Error Opening Top11.');
  }		
}

function close_top11() {
  $update = 'UPDATE top11 SET artist ="close" WHERE placement=98';
  $result = mysql_query($update);

  if (!$result) {
    die('Error Opening Top11.');
  }		
}

function top11_status() {
  $select = "SELECT artist FROM top11 WHERE placement = 98";
  $result = mysql_query($select);

  if (!$result) {
    die('error selecting from database.');
  }
  $info = mysql_fetch_assoc($result);

  return $info['artist'];	
}

?>
