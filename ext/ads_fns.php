<?php

function add_ad($name, $start_date, $end_date, $pic_url, $web_url) {
if (!get_magic_quotes_gpc()){
	$name = addslashes($name);
	$pic_url = addslashes($pic_url);
	$web_url = addslashes($web_url);
	}

$insert = "INSERT INTO ads VALUES (id, '".$name ."', '".$start_date. "', '". $end_date ."', '". $pic_url ."', '". $web_url ."', 'n')";

$result = mysql_query($insert);

if (!$result) {
	echo $insert ."<br>";
	die('Error Inserting into Database.');
	}
	
	echo "<center><h1>Success!</h1>".
	 "<p><h3>New Ad for ". $name. "</h3></center><p>".
	 "<br><hr width=75%>".
	 "<br><b>Start Date:</b> ". $start_date.
	 "<br><b>End Date:</b> ". $end_date.
	 "<br><b>Picture:</b><br> ".
	 "<img src='". $pic_url. "' width='200px'>".
	 "<br><b>Link:</b> ". $web_url.
	 "<p>";
}

function viewallactive_ads(){
$query = "SELECT * FROM ads WHERE deleted = 'n' AND end_date >= now() ORDER BY end_date";
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
				 "<br><b>Start Date: </b>". $info['start_date'].
				 "<br><b>End Date: </b>". $info['end_date'].
				 "<br><b>Picture:</b><br> ".
				 "<img src='". $info['pic_url']. "' width='200px'>".
				 "<br><b>Link: </b>". $info['web_url'].
				 '<br>[ <a href="editad.php?id=' .$info[id]. '">Edit</a> | <a href="deletead.php?id=' .$info[id]. '">Delete</a> ] <p>';
		}
echo '</ol>';
}

function edit_ad($id) {
$query = "SELECT * FROM ads where id=".$id;
$result = mysql_query($query);

if (!$result) {
	die('No results in database.');
	}
$info = mysql_fetch_assoc($result);
echo '<center><h1>Edit Ad for: '.$info["name"].'</h1></center><p>';
			

			echo '<form action="savead.php?id='.$info["id"].'" method="post">
				 <table id="edit_ad" border="0">
					<tr>
					<td>Name:</td>
					<td colspan="2"><input type="text" value="'.$info["name"].'" name="name" maxlength="55" size="45"></td>
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
						<td>Picture Link URL:</td>
						<td colspan="2"><input type="text" value="'.$info["pic_url"].'" name="pic_url" maxlength="120" size="64"></td>
					</tr>
					<tr>
						<td>Web Link URL:</td>
						<td colspan="2"><input type="text" value="'.$info["web_url"].'" name="web_url" maxlength="120" size="64"></td>
					</tr>
					<tr><td colspan="3">
					<input type="submit" value="Save Ad"></td>
					</tr>
		</table>
		</form>
<p>** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url';
}

function save_ad($id, $name, $start_date, $end_date, $pic_url, $web_url) {	
	if (!get_magic_quotes_gpc())
	{
		$id = addslashes($id);
		$start_date = addslashes($start_date);
		$end_date = addslashes($end_date);
		$name = addslashes($name);
		$pic_url = addslashes($pic_url);
		$web_url = addslashes($web_url);
	}

$update = "UPDATE ads SET start_date=\"$start_date\", end_date=\"$end_date\", name=\"$name\", pic_url=\"$pic_url\", web_url=\"$web_url\" WHERE id=".$id;
$result = mysql_query($update);

if (!$result) {
	echo $update ."<br>";
	die('Error Updating Database.');
	}
}

function delete_ad($id){
$update = "UPDATE ads set deleted ='y' where id=".$id;
$result = mysql_query($update);

if (!$result) {
	echo $update ."<br>";
	die('Error Updating Database.');
	}

	echo "<center><h1>Success!</h1>".
	 "<p><h3>The ad has been deleted.</h3></center><p>";
}

function show_ads(){
	$query = "SELECT * FROM ads WHERE deleted = 'n' AND start_date <= now() AND end_date >= now() ORDER BY end_date";
	$result = mysql_query($query);

	if (!$result) {
		echo "error: ". $query;
		die('Invalid');
		}
  if (mysql_num_rows($result) > 0)
	  echo "<div class=\"ads\">";

	for ($i=1; $i<=mysql_num_rows($result);$i++)
	{
		$info = mysql_fetch_assoc($result);
		echo "<a href=\"".$info['web_url']."\" target='_blank'><img src=\"".$info['pic_url']."\"></a>";
  }

  if (mysql_num_rows($result) > 0)
	  echo "</div>";
}
?>
