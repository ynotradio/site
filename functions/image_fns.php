<?php

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
    echo 
      "<br><b>Image Name: </b>". $info['file'].
      "<br><b>Picture: </b><br> <img src=\"/images/".$info['file'] ."\" height='250px';>".
      "<br>You can use this file: images\\" . $info['file'].
      "<p>";
  }
  echo '</ol>';
}

function add_image($file) {
  $insert = "INSERT INTO images VALUES (id, '".$file ."')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }
}

?>
