<?php

function display_custom_text($id){
  $query = "SELECT * FROM custom_text WHERE id =".$id;
  $result = mysql_query($query);

  if (!$result) {
    echo "There was an error getting this text";
  } else {
    $info = mysql_fetch_assoc($result);
    echo $info['html'];
  }
}

function view_custom_text($id) {
  $query = "SELECT * FROM custom_text WHERE id =".$id;
  $result = mysql_query($query);

  if (!$result) {
    echo "There was an error getting this text";
  } else {
    $info = mysql_fetch_assoc($result);
    echo $info['html'].
      '<p>'.
      '<center><h3> - - - - - - - - - - - - - - - - - - - - - - - </h3>'.
      '[ <a href="editcustomtext.php?id=' .$info[id]. '">Edit</a> ]</center>';
  }
}

function edit_custom_text($id){
  $query = "SELECT * FROM custom_text where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }

  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Edit Custom Text:</h3></center><p>';
  echo '<form action="savecustomtext.php?id='.$info["id"].'" method="post">
    <table id="edit_customtext" border="0">
    <tr>
    <td>Text:</td>
    <td><textarea name="html" cols=100 rows=25>'. $info["html"].'</textarea></td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save Custom Text"></td></tr>
    </table>
    </form>';
}

function save_custom_text($id, $html) {
  $id = mysql_real_escape_string($id);
  $html = mysql_real_escape_string($html);

  $update = "UPDATE custom_text SET html=\"$html\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }
}
?>
