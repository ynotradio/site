<?php

/*umca  - This needs to be sanitized! */
function add_contestant($firstname, $lastname, $email, $phone, $contest, $newsletter) {

   //Need to sanitize the input
    $firstname = mysqli_real_escape_string(open_db(), $firstname);
    $lastname = mysqli_real_escape_string(open_db(), $lastname);
    $email = mysqli_real_escape_string(open_db(), $email);
    $phone = mysqli_real_escape_string(open_db(), $phone);
    $contest = mysqli_real_escape_string(open_db(), $contest);
    $newsletter = mysqli_real_escape_string(open_db(), $newsletter);

    $insert = "INSERT INTO top11contest VALUES (id, '".$firstname ."', '".$lastname. "', '".$email. "', '".$phone. "', '".$contest. "', '".$newsletter. "', 'yes')";
    $result = mysql_query($insert);

  if (!$result) {
    echo $insert;
    echo 'Error Inserting into Database.';
  }
}

function add_ip($ip) {
  $ip = mysqli_real_escape_string(open_db(), $ip);
  $insert = "INSERT INTO ip_address VALUES (id, '".$ip ."', 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }
}

function add_top11_plus1($id){
  $id = mysqli_real_escape_string(open_db(), $id);
  $update = "UPDATE top11songs SET value = value + 1  WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    die('error updating database. Code: 353');
  }
}

function add_top11_song($artist, $song) {
  $artist = mysqli_real_escape_string(open_db(), $artist);
  $song = mysqli_real_escape_string(open_db(), $song);

  $insert = "INSERT INTO top11songs VALUES (id, '".$artist ."', '".$song. "', 0, 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The new Top 11 song has been saved</h3>".
    "<hr width=75%>";
  display_top11_song(get_top11_song(mysql_insert_id()));
  echo "</div>";
}

function check_ip($ip) {
  $ip = mysqli_real_escape_string(open_db(), $ip);
  $select = "SELECT * FROM ip_address WHERE address = '$ip' AND deleted = 'n'";
  $result = mysql_query($select);
  $info = mysql_fetch_assoc($result);
  if ($info['address']) {
    return false;
  } else {
    add_ip($ip);	
    return true;
  }
}

function close_top11() {
  $update = 'UPDATE top11 SET artist ="closed" WHERE placement=98';
  $result = mysql_query($update);

  if (!$result) {
    die('Error Opening Top11.');
  }		
}

function contestant_count() {
  $select = "SELECT * FROM top11contest WHERE display = 'yes' AND contest = 'yes'";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  return "(" .mysql_num_rows($result) ." total entries)";
}

function delete_top11_song($id){

  $id = mysqli_real_escape_string(open_db(), $id);
  $update = "UPDATE top11songs set deleted ='y' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo "'Error deleting the Top 11 song from the database: ". $update ."<br>";
  } else {
    $top11_song = get_top11_song($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
      "<h3>The Top 11 song <span class=\"success\">". $top11_song['song'] ." by ". $top11_song['artist'] ."</span> has been deleted.</h3></div>";
  }
}

function display_contestants() {
  $select = "SELECT * FROM top11contest WHERE display = 'yes' AND contest = 'yes' ORDER BY id";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<h2 class=\"center\">All Top 11 Contestants</h2>";
  for ($i=1; $i<=mysql_num_rows($result);$i++) {
    echo "<ol>";
    $info = mysql_fetch_assoc($result);
    echo
      "<b>Name: </b>". $info['firstname']. " " . $info['lastname'] .
      "<br><b>Email: </b>". $info['email'].
      "<br><b>Phone: </b>". $info['phone'].
      "<br><b>Newsletter: </b>". $info['newsletter'] . "</ol>";
  }
}
function display_form($action_file)
{
  $select = "SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY artist";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<h2 class=\"center\">Vote for Your Top 3 Y-Not Songs of the Week</h2>\n";
  echo "<form action=".$action_file." method=\"post\" name=\"top11\" class=\"form-default\">
    <fieldset>\n<div class=\"control-group\">\n<div class=\"controls\">\n";

  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    echo "<label for=\"".$info['id']."\" class=\"half\"><input type=\"checkbox\" name=\"top11[]\" id=\"".$info['id']."\" value=\"".$info['id']."\">".
      "<span class=\"top11_entry\"> " . $info['artist'] ." - ".$info['song'] ."\n</span>\n</label>\n";
  }
  echo "</div></div>\n<div class=\"control-group\">\n<div class=\"controls\">\n";
  echo "<input type=\"checkbox\" id=\"top11_write_in\"> <input type=\"text\" disabled=\"disabled\" class=\"input-xl\" id=\"write_in_value\" name=\"write_in_value\">\n".
    "<div class=\"form-other\">Other (please specify)</div>\n</div>\n</div>\n";

  echo "<div class=\"control-group top-spacer_20 input-seperation\">\n".
    "<label>First Name</label>\n<div class=\"controls\">\n<input type=\"text\" name=\"firstname\" class=\"input-l\"></div>\n".
    "<label>Last Name</label>\n<div class=\"controls\">\n<input type=\"text\" name=\"lastname\" class=\"input-l\"/></div>\n".
    "<label>E-mail</label>\n<div class=\"controls\"><input type=\"text\" name=\"email\" class=\"input-l\"/></div>\n".
    "<label>Phone Number</label>\n<div class=\"controls\"><input type=\"text\" name=\"phone\" class=\"input-l\"/></div>\n".
    "<label>Would you like to be entered into this week's contest?</label>\n".
    "<div class=\"controls inline clearfix\"><label for=\"yes\"><input type=\"radio\" name=\"contest\" id=\"yes\" value=\"yes\" />Yes</label>".
    "<label for=\"no\"><input type=\"radio\" name=\"contest\" id=\"no\" value=\"no\" />No</label></div>\n".
    "<label>Would you like to receive Y-Not Radio's weekly Y-Mail newsletter?</label>\n".
    "<div class=\"controls inline clearfix\"><label for=\"newsletter-yes\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-yes\" value=\"yes\" />Yes</label>".
    "<label for=\"newsletter-no\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-no\" value=\"no\" />No</label>".
    "<label for=\"newsletter-already\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-already\" value=\"already\" />I Already Receive It</label></div>\n".
    "<div class=\"form-actions\"><button class=\"btn-info\" type=\"submit\">Cast Your Vote</button>\n" .
    "<input type=\"hidden\" name=\"action\" value=\"write\"></div>".
    "</form>\n</div>\n</fieldset>";
}	

function display_top11_message() {
  $select = "SELECT * FROM top11message WHERE id = '1'";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  $info = mysql_fetch_assoc($result);
  echo "<div class=\"top11-message full_height\">
    <img src=\"imgs/knob_11.jpg\" alt=\"Top 11\" /></td>
    <td id=\"top11message\">" . $info['message'] .
    "</div>";
}

function display_top11_song($top11_song) {
  echo "<br><b>Artist:</b> ". $top11_song['artist'].
    "<br><b>Song:</b> ". $top11_song['song'];
}

function export() {
  $select = "SELECT * FROM top11contest WHERE contest =  'yes' AND display = 'yes' ORDER BY id";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<h2 class=\"center\">Top 11 Contestants</h2>";
  echo "<table class='table table-striped table-bordered-horizontal table-condensed table-center'>
    <thead><tr>\n<th>Name</th><th>Email</th><th>Phone</th><th>Newsletter</th></tr></thead>\n";
  for ($i=1; $i<=mysql_num_rows($result);$i++) {

    $info = mysql_fetch_assoc($result);
    echo
      "<tr><td>". $info['firstname']. " " . $info['lastname']. " </td>".
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
  echo "<h2 class=\"center\">Non-contestant voters - add to Newsletter</h2>
    <table class='table table-striped table-bordered-horizontal table-condensed no-header table-center'>";
    for ($i=1; $i<=mysql_num_rows($result);$i++) {

    $info = mysql_fetch_assoc($result);
    echo
      "<tr><td>". $info['firstname']. " " . $info['lastname']. "</td>".
      "<td>". $info['email']."</td></tr>";
  }
  echo "</table>"	;
}

function get_top11() {
  $query = "SELECT * FROM top11";
  $result = mysql_query($query);

  if (!$result)
    die('No results in database.');
  else
    return $result;
}

function get_top11_message() {
  $query = "SELECT * FROM top11message where id=1";
  $result = mysql_query($query);

  if (!$result)
    die('No results in database.');
  else
    return $result;
}

function get_top11_song($id) {
  $query = "SELECT * FROM top11songs where id=".$id;
  $result = mysql_query($query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysql_fetch_assoc($result);
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

function nuke() {
  echo "<div class=\"center\"><h2>Top 11 Values have been nuked</h2></div>";
  $update = "UPDATE top11songs SET value = 0";
  $result = mysql_query($update);

  if (!$result)
    die('error updating database. Code: 261');
  else
    echo "<div class=\"center\">Top 11 Stats - <b>NUKED</b></div>";

  $update = "UPDATE write_in SET deleted = 'yes'";
  $result = mysql_query($update);

  if (!$result)
    die('error updating database. Code: 269');
  else
    echo "<div class=\"center\">Top 11 Write-ins - <b>NUKED</b></div>";

  $update = "UPDATE top11contest SET display = 'no'";
  $result = mysql_query($update);

  if (!$result)
    die('error updating database. Code: 277');
  else
    echo "<div class=\"center\">Top 11 Contestants - <b>NUKED</b></div>";

  $update = "UPDATE ip_address SET deleted = 'yes'";
  $result = mysql_query($update);

  if (!$result)
    die('error updating database. Code: 285');
  else
    echo "<div class=\"center\">IP Addresses - <b>NUKED</b></div>";

}

function open_top11() {
  $update = 'UPDATE top11 SET artist ="open" WHERE placement=98';
  $result = mysql_query($update);

  if (!$result) {
    die('Error Opening Top11.');
  }		
}

function pick_a_winner() {
  $select = "SELECT * FROM top11contest WHERE display = 'yes' AND contest = 'yes' ORDER BY RAND() LIMIT 1";
  $result = mysql_query($select);

  if (!$result) {
    echo $select;
    die('error selecting from database.');
  }
  echo "<div class=\"center\">\n<h1>Winner!</h1>";
  $info = mysql_fetch_assoc($result);
  echo "<b>Name: </b>" . $info['firstname'] . " " . $info['lastname'] . "<br>".
    "<b>Email: </b>" . $info['email'] . "<br>".
    "<b>Phone: </b>" . $info['phone'] . "<p>".
    contestant_count() ."</div>\n";
}

function stats() {
  $select = "SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY value DESC";
  $result = mysql_query($select);

  if (!$result) {
    die('error updating database. Code: 229');
  }
  echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">";
  echo "<thead><tr><th>Spot</th><th>Arist</th><th>Song</th><th>Value</th></tr></thead>";

  for ($i=1; $i<=mysql_num_rows($result);$i++) {
    $info = mysql_fetch_assoc($result);
    echo "<tr><td>" .$i . "</td>\n".
      "<td>".$info['artist'] . "</td>\n".
      "<td>" .$info['song']. "</td>\n".
      "<td>" .$info['value']. "</td>\n".
      "</tr>\n";	
  }		
  echo "</table>\n";
}	

function toggle_status($current_status) {
  if ($current_status == 'open') {
    close_top11();
    echo "<div class=\"center\"><h2>You have <span class=\"success\">closed</span> Top 11 voting</h2></div>";
  } else {
    open_top11();
    echo "<div class=\"center\"><h2>You have <span class=\"success\">opened</span> Top 11 voting</h2></div>";
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

function update_top11($placement, $artist, $song, $note){
  $placement = mysqli_real_escape_string(open_db(), $placement);
  $artist = mysqli_real_escape_string(open_db(), $artist);
  $song = mysqli_real_escape_string(open_db(), $song);
  $note = mysqli_real_escape_string(open_db(), $note);

  $update = 'UPDATE top11 SET artist =\''.$artist .'\', song=\''.$song . '\', note=\''.$note. '\' WHERE placement='.$placement;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }
}

function update_top11_date($date){
  $update = 'UPDATE top11 SET artist =\''.$date .'\' WHERE placement=99';
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database. Code: 98');
  }			
}

function update_top11_message($message){
  $message = mysqli_real_escape_string(open_db(), $message);

  $update = 'UPDATE top11message SET message =\''.$message .'\' WHERE id=1';
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database. Code: 517');
  }			
}

function update_top11_song($id, $artist, $song) {
  $artist = mysqli_real_escape_string(open_db(), $artist);
  $song = mysqli_real_escape_string(open_db(), $song);

  $update = "UPDATE top11songs SET artist=\"$artist\", song=\"$song\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function view_all_top11_songs() {
  $query = "SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY artist";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">";
  echo "<thead><tr><th>Arist</th><th>Song</th><th colspan='2'>Actions</th></tr></thead>";

  for ($i=1; $i<=mysql_num_rows($result);$i++) {
    $info = mysql_fetch_assoc($result);
    echo "<tr>\n
      <td>".$info['artist'] . "</td>\n".
      "<td>" .$info['song']. "</td>\n".
      "<td><a href=\"top11_song_update.php?id=" .$info[id]. "\">Edit</a></td>\n".
      "<td><a href=\"top11_song_delete.php?id=" .$info[id]. "\">Delete</a></td>\n".
      "</tr>\n";
  }
  echo "</table>";
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

function write_in($write_in) {
  $insert = "INSERT INTO write_in VALUES (id, '".$write_in ."', 'no')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }
}

?>
