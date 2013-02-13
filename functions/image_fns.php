<?php

function add_image($file_name) {
  $insert = "INSERT INTO images VALUES (id, '".$file_name ."')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }
}

function disply_image($image) {
  echo"<br><b>Image Name: </b>". $image['file'].
    "<br><b>Picture: </b><br>
    <img src=\"/images/".$image['file'] ."\" height='250px';>".
    "<br>You can use this file: images\\" . $image['file'] . "<p>";
}

function get_image($id) {
  $query = "SELECT * FROM images where id=".$id;
  $result = mysql_query($query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysql_fetch_assoc($result);
}

function view_all_images(){
  $query = "SELECT * FROM images ORDER BY file";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    disply_image($info);
  }
  echo '</ol>';
}

?>
