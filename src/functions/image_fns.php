<?php

function add_image($file_name) {
  $insert = "INSERT INTO images VALUES (id, '".$file_name ."')";
  $result = mysqli_query(open_db(), $insert);

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
  $result = mysqli_query(open_db(), $query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysqli_fetch_assoc($result);
}

function view_all_images(){
  $query = "SELECT * FROM images ORDER BY file";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysqli_num_rows($result);$i++)
  {
    $info = mysqli_fetch_assoc($result);
    disply_image($info);
  }
  echo '</ol>';
}

?>
