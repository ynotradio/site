<?php

function add_on_demand($date, $image, $headline, $note, $songs, $audio_id) {
  $date = mysqli_real_escape_string(open_db(), $date);
  $image = mysqli_real_escape_string(open_db(), $image);
  $headline = mysqli_real_escape_string(open_db(), $headline);
  $note = mysqli_real_escape_string(open_db(), $note);
  $songs = mysqli_real_escape_string(open_db(), $songs);
  $audio_id = mysqli_real_escape_string(open_db(), $audio_id);

  $insert = "INSERT INTO ondemand VALUES (id, '".$date ."', '".$image ."', '".$headline. "', '".$note. "', '".$songs. "', '".$audio_id. "', 'opendrive', 'no')";
  $result = mysqli_query(open_db(), $insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
       "<h3>New On Demand, ". $headline. ", has been saved</h3>".
       "<hr width=75%>";
  display_on_demand(get_on_demand(mysqli_insert_id()));
  echo "</div>";
}

function delete_on_demand($id){
  $update = "UPDATE ondemand SET deleted ='yes' where id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result) {
    echo "'Error deleting the on demand entry from the database: ". $update ."<br>";
  } else {
    $ondemand = get_on_demand($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>The on demand entry <span class=\"success\">". $ondemand['headline'] ."</span>, has been deleted.</h3></div>";
  }
}

function display_on_demand($ondemand) {
  echo "<br><b>Headline: </b>". $ondemand['headline'].
    "<br><b>Songs Performed: </b>". $ondemand['songs'].
    "<br><b>Note: </b>". $ondemand['note'].
    "<br><b>Image: </b><br><img src=\"". $ondemand['image']. "\"height=100px> ".
    "<br><b>Date: </b>". $ondemand['date'].
    "<br><b>Audio ID: </b>". $ondemand['audio_url'];
}

function get_on_demand($id) {
  $query = "SELECT * FROM ondemand where id=".$id;
  $result = mysqli_query(open_db(), $query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysqli_fetch_assoc($result);
}

function on_demand_player($id) {
  
  $cleanId = filter_var($id,FILTER_SANITIZE_NUMBER_INT);
  
  $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, image, headline, note, songs, audio_url FROM ondemand WHERE id = $cleanId";
  $result = mysqli_query(open_db(), $query);

  if (!$result || mysqli_num_rows($result) == 0) {
    echo "<div class=\"center error\">Something went wrong, go back and try again.</div>";
  } else {
    for ($i=1; $i<=mysqli_num_rows($result);$i++) {
    $info = mysqli_fetch_assoc($result);
    echo "<tr>\n<td><img src=\"" . $info['image']. "\"></td>\n".
      "<td>\n<div class='t'><strong>". $info['headline']."</strong></div>\n".
      "<div>". $info['note']. "</div>\n".
      "<div>Songs Performed: ".$info['songs']. "</div>\n".
      "<div>Date: ".$info['fdate']. "</div>\n".
      "<div><iframe src=\"https://www.opendrive.com/player/". $info['audio_url'] ."\" height=\"40\" width=\"370\" style=\"border:0\" scrolling=\"no\" frameborder=\"0\" allowtransparency=\"true\"></iframe>\n</div>\n</tr>";
    }
  }
}

function paginate($lastpage, $targetpage, $adjacents, $page, $lpm1){
  $pagination = "";
  $prev = $page - 1;							          //previous page is page - 1
  $next = $page + 1;							          //next page is page + 1

  if($lastpage > 1) {
    $pagination .= "<div class=\"pagination center\">";
    //previous button
    if ($page > 1)
      $pagination.= "<a href=\"$targetpage&page=$prev\">« previous</a>";
    else
      $pagination.= "<span class=\"disabled\">« previous</span>";

    //pages
    if ($lastpage < 7 + ($adjacents * 2))	{
      //not enough pages to bother breaking it up
      for ($counter = 1; $counter <= $lastpage; $counter++) {
        if ($counter == $page)
          $pagination.= "<span class=\"current\">$counter</span>";
        else
          $pagination.= "<a href=\"$targetpage&page=$counter\">$counter</a>";
      }
    } elseif($lastpage > 5 + ($adjacents * 2)) {
      //enough pages to hide some - close to beginning; only hide later pages
      if($page < 1 + ($adjacents * 2)) {
        for ($counter = 1; $counter < 4 + ($adjacents * 2); $counter++) {
          if ($counter == $page)
            $pagination.= "<span class=\"current\">$counter</span>";
          else
            $pagination.= "<a href=\"$targetpage&page=$counter\">$counter</a>";
        }
        $pagination.= " . . . ";
        $pagination.= "<a href=\"$targetpage&page=$lpm1\">$lpm1</a>";
        $pagination.= "<a href=\"$targetpage&page=$lastpage\">$lastpage</a>";
      } elseif($lastpage - ($adjacents * 2) > $page && $page > ($adjacents * 2)) {
        //in middle; hide some front and some back
        $pagination.= "<a href=\"$targetpage&page=1\">1</a>";
        $pagination.= "<a href=\"$targetpage&page=2\">2</a>";
        $pagination.= "...";
        for ($counter = $page - $adjacents; $counter <= $page + $adjacents; $counter++) {
          if ($counter == $page)
            $pagination.= "<span class=\"current\">$counter</span>";
          else
            $pagination.= "<a href=\"$targetpage&page=$counter\">$counter</a>";
        }
        $pagination.= "...";
        $pagination.= "<a href=\"$targetpage&page=$lpm1\">$lpm1</a>";
        $pagination.= "<a href=\"$targetpage&page=$lastpage\">$lastpage</a>";
      } else {
        //close to end; only hide early pages
        $pagination.= "<a href=\"$targetpage&page=1\">1</a>";
        $pagination.= "<a href=\"$targetpage&page=2\">2</a>";
        $pagination.= "...";
        for ($counter = $lastpage - (2 + ($adjacents * 2)); $counter <= $lastpage; $counter++) {
          if ($counter == $page)
            $pagination.= "<span class=\"current\">$counter</span>";
          else
            $pagination.= "<a href=\"$targetpage&page=$counter\">$counter</a>";
        }
      }
    }

    //next button
    if ($page < $counter - 1)
      $pagination.= "<a href=\"$targetpage&page=$next\">next »</a>";
    else
      $pagination.= "<span class=\"disabled\">next »</span>";
    $pagination.= "</div>\n";
  }

  return $pagination;
}

function update_on_demand($id, $date, $image, $headline, $note, $songs, $url) {
  $date = mysqli_real_escape_string(open_db(), $date);
  $image = mysqli_real_escape_string(open_db(), $image);
  $headline = mysqli_real_escape_string(open_db(), $headline);
  $note = mysqli_real_escape_string(open_db(), $note);
  $songs = mysqli_real_escape_string(open_db(), $songs);
  $url = mysqli_real_escape_string(open_db(), $url);

  $update = "UPDATE ondemand SET date=\"$date\", image=\"$image\", headline=\"$headline\", note=\"$note\", songs=\"$songs\", audio_url=\"$url\" WHERE id=".$id;
  $result = mysqli_query(open_db(), $update);

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function show_on_demand($sort) {
  $tbl_name = "ondemand";
  if ($sort != "text") {
    $adjacents = 3;

    $count_query = "SELECT COUNT(*) as num FROM $tbl_name WHERE DELETED = 'no'";
    $total_pages = mysqli_fetch_array(mysqli_query(open_db(), $count_query));
    $total_pages = $total_pages['num'];

    if ($sort == "date")
      $targetpage = "ondemand.php?sort=date";
    if ($sort == "artist")
      $targetpage = "ondemand.php?sort=artist";
    $limit = 5;

    $page = $_GET['page'];
    if($page)
      $start = ($page - 1) * $limit;	//first item to display on this page
    else
      $start = 0;								      //if no page var is given, set start to 0

    /* Get data */
    if ($sort == "date")
      $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, id, image, headline, note, songs, audio_url FROM $tbl_name  WHERE deleted = 'no' ORDER BY date DESC LIMIT $start, $limit";
    else
      $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, id, image, headline, note, songs, audio_url FROM $tbl_name  WHERE deleted = 'no' ORDER BY headline LIMIT $start, $limit";

    $result = mysqli_query(open_db(), $query);

    if (!$result) {
      echo "error: ". $query;
      die('Invalid');
    }

    /* Setup page vars for display. */
    if ($page == 0) $page = 1;					      //if no page var is given, default to 1.
    $lastpage = ceil($total_pages/$limit);		//lastpage is = total pages / items per page, rounded UP
    $lpm1 = $lastpage - 1;						        //last page minus 1

    echo '<table class="ondemand">';
    for ($i=1; $i<=mysqli_num_rows($result);$i++)
    {
      $info = mysqli_fetch_assoc($result);
      on_demand_player($info['id']);
    }	
    echo '</table>';			

    echo paginate($lastpage, $targetpage, $adjacents, $page, $lpm1);
  } //end of if not text
  else
  {
    $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, id, headline FROM $tbl_name WHERE deleted = 'no' ORDER BY headline, date DESC";
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
      echo "error: ". $query;
      die('Invalid');
    }

    echo '<table class="ondemand">';
    for ($i=1; $i<=mysqli_num_rows($result);$i++)
    {
      $info = mysqli_fetch_assoc($result);
      echo "<tr>\n<td>\n<a href=\"ondemand.php?id=". $info['id']. "\">". $info['headline'] ."\n( ". $info['fdate']." )</a></td>\n</tr>\n";			
    }	
    echo '</table>';
  } //end of else sort == text
} //end of function

function view_all_on_demands(){
  $query = "SELECT * FROM ondemand WHERE deleted = 'no' ORDER BY date Desc";
  $result = mysqli_query(open_db(), $query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  echo '<ol>';
  for ($i=1; $i<=mysqli_num_rows($result);$i++)
  {
    $info = mysqli_fetch_assoc($result);
    display_on_demand($info);
    echo '<br>[ <a href="ondemand.php?id=' .$info[id].'" target=_new >Listen</a> | <a href="ondemand_update.php?id=' .$info[id]. '">Edit</a> | <a href="ondemand_delete.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

?>