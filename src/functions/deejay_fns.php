<?php
// Legacy function file - uses DeejayModel under the hood

require_once __DIR__ . "/../models/DeejayFactory.php";
require_once __DIR__ . "/main_fns.php";

function sort_deejays() {
  // This endpoint is deprecated - new code should use /cp/api/deejay_sort.php
  // Only used for backward compatibility
  if(!isset($_POST['item'])) {
    return false;
  }
  
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    return $deejayModel->updateSortOrder($_POST['item']);
  } catch (Exception $e) {
    error_log("Error in sort_deejays: " . $e->getMessage());
    return false;
  }
}

// Only run the sort function if this file is accessed directly
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
  sort_deejays();
}

function add_deejay($name, $show, $email, $external_connect_text, $external_connect_url, $pic) {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    
    $data = [
      'name' => $name,
      'show' => $show,
      'email' => $email,
      'external_connect_text' => $external_connect_text,
      'external_connect_url' => $external_connect_url,
      'pic' => $pic
    ];
    
    $id = $deejayModel->add($data);
    $deejay = $deejayModel->getById($id);
    
    echo "<div class=\"center\"><h1>Success!</h1>".
         "<h3>New Deejay, ". $name. ", has been saved</h3>".
         "<hr width=75%>";
    display_deejay($deejay);
    echo "</div>";
    
    return $id;
  } catch (Exception $e) {
    echo $e->getMessage() ."<br>";
    die('Error Inserting into Database.');
  }
}

function deejay_name($id) {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    return $deejayModel->getName($id);
  } catch (Exception $e) {
    error_log("Error in deejay_name: " . $e->getMessage());
    return "Unknown Deejay";
  }
}

function delete_deejay($id){
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    
    $deejay = $deejayModel->getById($id);
    if (!$deejay) {
      echo "<div class=\"center\"><h1>Error!</h1>".
      "<h3>Deejay not found.</h3></div>";
      return false;
    }
    
    $success = $deejayModel->delete($id);
    if (!$success) {
      echo "<div class=\"center\"><h1>Error!</h1>".
      "<h3>Failed to delete deejay.</h3></div>";
      return false;
    }
    
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The deejay <span class=\"success\">". $deejay['name'] ."</span> has been deleted.</h3></div>";
    return true;
  } catch (Exception $e) {
    echo "<div class=\"center\"><h1>Error!</h1>".
    "<h3>". $e->getMessage() ."</h3></div>";
    return false;
  }
}

function display_deejay($deejay) {
  echo "<div class='sort-item' id='item-" . $deejay['id'] . "'>". 
  "<div class='handle'></div>" . 
  "<b>Name:</b> ". $deejay['name'].
  "<br><b>Show:</b> ". $deejay['show'].
  "<br><b>Email:</b> ". $deejay['email'].
  "<br><b>External Connect Text:</b> ". $deejay['external_connect_text'].
  "<br><b>External Connect URL:</b> ". $deejay['external_connect_url'];
  if ($deejay['pic'] != "") {
    echo "<br><b>Deejay Picture:</b><br><img src=\"". $deejay['pic']. "\" height='150px';>\n";
  } else {
    echo "<br><b>Deejay Picture:</b><br> <img src=\"/imgs/na.jpg\" height='100px';>\n";
  }

  echo '<br>[ <a href="deejay_update.php?id=' .$deejay['id']. '">Edit</a> | <a href="deejay_delete.php?id=' .$deejay['id']. '">Delete</a> ] <p>';
  echo '</div>';
}

function display_all_deejays($deejays){
  for ($i=0; $i < sizeof($deejays);$i++)
  {
    $info = $deejays[$i];
    echo "<div class=\"deejay\">".
      "<img src=\"". $info['pic']. "\" width='150px';>\n".
      "<h2>" . $info['name']. "</h2>\n";
    if ($info['show'])
      echo "<div class=\"show_title\">" . $info['show']. "</div>\n";
    echo "<div><a href=\"mailto:".$info['email']."\">E-Mail</a></div>\n";
    if ($info['external_connect_text'] && $info['external_connect_url'])
      echo "<div><a href=\"" . $info['external_connect_url'] ."\" target=_new>". $info['external_connect_text'] . "</a></div>\n";
    echo "</div>";
  }
}

function get_deejay($id) {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    return $deejayModel->getById($id);
  } catch (Exception $e) {
    error_log("Error in get_deejay: " . $e->getMessage());
    echo 'No results in database.';
    return null;
  }
}

function get_deejays() {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    return $deejayModel->getAll();
  } catch (Exception $e) {
    error_log("Error in get_deejays: " . $e->getMessage());
    die('Invalid query: ' . $e->getMessage());
  }
}

function update_deejay($id, $name, $show, $email, $external_connect_text, $external_connect_url, $pic) {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    
    $data = [
      'name' => $name,
      'show' => $show,
      'email' => $email,
      'external_connect_text' => $external_connect_text,
      'external_connect_url' => $external_connect_url,
      'pic' => $pic
    ];
    
    return $deejayModel->update($id, $data);
  } catch (Exception $e) {
    error_log("Error in update_deejay: " . $e->getMessage());
    echo "There was an error updating: <br>" . $e->getMessage();
    return false;
  }
}

function view_all_deejays(){
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    $deejays = $deejayModel->getAllFlat();
    
    echo '<ol>';
    foreach ($deejays as $deejay) {
      display_deejay($deejay);
    }
    echo '</ol>';
  } catch (Exception $e) {
    error_log("Error in view_all_deejays: " . $e->getMessage());
    echo "Error: " . $e->getMessage();
  }
}
      $pic = mysqli_real_escape_string(open_db(), $pic);

  $insert = "INSERT INTO deejays VALUES (id, '".$name ."', '".$show. "', '".$email. "', '".$external_connect_text. "', '". $external_connect_url ."', '". $pic ."', '1', 'no')";
  $link = open_db();
  $result = mysqli_query($link, $insert);;

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New Deejay, ". $name. ", has been saved</h3>".
       "<hr width=75%>";
  display_deejay(get_deejay(mysqli_insert_id($link)));
  echo "</div>";
}

function deejay_name($id) {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    return $deejayModel->getName($id);
  } catch (Exception $e) {
    error_log("Error in deejay_name: " . $e->getMessage());
    return "Unknown Deejay";
  }
}

function delete_deejay($id){
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    
    $deejay = $deejayModel->getById($id);
    if (!$deejay) {
      echo "<div class=\"center\"><h1>Error!</h1>".
      "<h3>Deejay not found.</h3></div>";
      return false;
    }
    
    $success = $deejayModel->delete($id);
    if (!$success) {
      echo "<div class=\"center\"><h1>Error!</h1>".
      "<h3>Failed to delete deejay.</h3></div>";
      return false;
    }
    
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The deejay <span class=\"success\">". $deejay['name'] ."</span> has been deleted.</h3></div>";
    return true;
  } catch (Exception $e) {
    echo "<div class=\"center\"><h1>Error!</h1>".
    "<h3>". $e->getMessage() ."</h3></div>";
    return false;
  }
}

function display_deejay($deejay) {
  echo "<div class='sort-item' id='item-" . $deejay['id'] . "'>". 
  "<div class='handle'></div>" . 
  "<b>Name:</b> ". $deejay['name'].
  "<br><b>Show:</b> ". $deejay['show'].
  "<br><b>Email:</b> ". $deejay['email'].
  "<br><b>External Connect Text:</b> ". $deejay['external_connect_text'].
  "<br><b>External Connect URL:</b> ". $deejay['external_connect_url'];
  if ($deejay['pic'] != "") {
    echo "<br><b>Deejay Picture:</b><br><img src=\"". $deejay['pic']. "\" height='150px';>\n";
  } else {
    echo "<br><b>Deejay Picture:</b><br> <img src=\"/imgs/na.jpg\" height='100px';>\n";
  }

  echo '<br>[ <a href="deejay_update.php?id=' .$deejay['id']. '">Edit</a> | <a href="deejay_delete.php?id=' .$deejay['id']. '">Delete</a> ] <p>';
  echo '</div>';
}

function display_all_deejays($deejays){
  for ($i=0; $i < sizeof($deejays);$i++)
  {
    $info = $deejays[$i];
    echo "<div class=\"deejay\">".
      "<img src=\"". $info['pic']. "\" width='150px';>\n".
      "<h2>" . $info['name']. "</h2>\n";
    if ($info['show'])
      echo "<div class=\"show_title\">" . $info['show']. "</div>\n";
    echo "<div><a href=\"mailto:".$info['email']."\">E-Mail</a></div>\n";
    if ($info['external_connect_text'] && $info['external_connect_url'])
      echo "<div><a href=\"" . $info['external_connect_url'] ."\" target=_new>". $info['external_connect_text'] . "</a></div>\n";
    echo "</div>";
  }
}

function get_deejay($id) {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    return $deejayModel->getById($id);
  } catch (Exception $e) {
    error_log("Error in get_deejay: " . $e->getMessage());
    echo 'No results in database.';
    return null;
  }
}

function get_deejays() {
  try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    return $deejayModel->getAll();
  } catch (Exception $e) {
    error_log("Error in get_deejays: " . $e->getMessage());
    die('Invalid query: ' . $e->getMessage());
  }
}

function update_deejay($id, $name, $show, $email, $external_connect_text, $external_connect_url, $pic) {
  $name = mysqli_real_escape_string(open_db(), $name);
  $show = mysqli_real_escape_string(open_db(), $show);
  $email = mysqli_real_escape_string(open_db(), $email);
  $external_connect_text = mysqli_real_escape_string(open_db(), $external_connect_text);
  $external_connect_url = mysqli_real_escape_string(open_db(), $external_connect_url);
  $pic = mysqli_real_escape_string(open_db(), $pic);

  $update = "UPDATE deejays SET name=\"$name\", `show`=\"$show\", email=\"$email\", external_connect_text=\"$external_connect_text\",external_connect_url=\"$external_connect_url\", pic=\"$pic\" WHERE id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function view_all_deejays(){
  $query = "SELECT * FROM deejays WHERE deleted = 'no' ORDER BY sort";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysqli_num_rows($result);$i++) {
    $info = mysqli_fetch_assoc($result);
    display_deejay($info);
  }
  echo '</ol>';
}

?>
