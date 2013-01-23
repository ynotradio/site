<?php

function view_all_on_demands(){
  $query = "SELECT * FROM ondemand2 WHERE deleted = 'no' ORDER BY date Desc";
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
      "<br><b>Date: </b>". $info['date'].
      "<br><b>Image: </b><br><img src=\"". $info['image']. "\"height=100px> ".
      "<br><b>Headline: </b>". $info['headline'].
      "<br><b>Note: </b>". $info['note'].
      "<br><b>Songs Performed: </b>". $info['songs'].
      "<br><b>Audio ID: </b>". $info['audio_url'].
      "<br><b>Audio Source: </b>". $info['source'].
      '<br>[ <a href="ondemand.php?id=' .$info[id].'" target=_new >Listen</a> | <a href="editondemand.php?id=' .$info[id]. '">Edit</a> | <a href="deleteondemand.php?id=' .$info[id]. '">Delete</a> ] <p>';
  }
  echo '</ol>';
}

function edit_on_demand($id) {
  $query = "SELECT * FROM ondemand2 where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Edit On Demand:</h3></center><p>';


  echo '<form action="saveondemand.php?id='.$info["id"].'" method="post">
    <table id="edit_ondemand" border="0">
    <tr>
    <td>Date:</td>
    <td><input type="text" value="'.$info["date"].'" name="date" maxlength="25" size="25"></td>
    </tr>
    <tr>
    <td>Image:</td>
    <td><input type="text" value="'.$info["image"].'" name="image" maxlength="115" size="90"></td>
    </tr>
    <tr>
    <td>Headline:</td>
    <td><input type="text" value="'.$info["headline"].'" name="headline" maxlength="60" size="50"></td>
    </tr>
    <tr>
    <td>Note:</td>
    <td><input type="text" value="'.$info["note"].'" name="note" maxlength="60" size="50"></td>
    </tr>
    <tr>
    <td>Songs Performed:</td>
    <td><input type="text" value="'.$info["songs"].'" name="songs" maxlength="250" size="90"></td>
    </tr>
    <tr>
    <td>Audio ID:</td>
    <td><input type="text" value="'.$info["audio_url"].'" name="url" maxlength="115" size="90"></td>
    </tr>
    <tr>
    <td>Audio Source:</td>
    <td><input type="radio" name="source" value="opendrive" ';
  if ($info["source"] == "opendrive"){
    echo "checked";
  }
  echo '/> Open Drive<br>
    <input type="radio" name="source" value="4shared" ';
  if ($info["source"] == "4shared"){
    echo "checked";
  }						
  echo '/> 4Shared </td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save On Demand"></td></tr>
    </table>
    </form>
    <p>** if the audio url is over 128 characters: use <a href="http://www.bit.ly" target=_GET>bit.ly</a> to shorten the url';
}

function save_on_demand($id, $date, $image, $headline, $note, $songs, $url, $source) {
  $date = mysql_real_escape_string($date);
  $image = mysql_real_escape_string($image);
  $headline = mysql_real_escape_string($headline);
  $note = mysql_real_escape_string($note);
  $songs = mysql_real_escape_string($songs);		
  $url = mysql_real_escape_string($url);
  $source = mysql_real_escape_string($source);

  $update = "UPDATE ondemand2 SET date=\"$date\", image=\"$image\", headline=\"$headline\", note=\"$note\", songs=\"$songs\", audio_url=\"$url\", source=\"$source\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h3>On Demand Entry has been saved</h3></center><br>";
}

function add_on_demand($date, $image, $headline, $note, $songs, $url, $source) {
  $date = mysql_real_escape_string($date);
  $image = mysql_real_escape_string($image);
  $headline = mysql_real_escape_string($headline);
  $note = mysql_real_escape_string($note);
  $songs = mysql_real_escape_string($songs);
  $url = mysql_real_escape_string($url);
  $source = mysql_real_escape_string($source);

  $insert = "INSERT INTO ondemand2 VALUES (id, '".$date ."', '".$image ."', '".$headline. "', '".$note. "', '".$songs. "', '".$url. "', '".$source. "', 'no')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p>". $headline. " - ". $note. "\n".
    "<p></center>\n";
}

function delete_on_demand($id){
  $update = "UPDATE ondemand2 SET deleted ='yes' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3> On Demand entry has been deleted.</h3></center><p>";
}

function show_on_demand($sort){
  $tbl_name = "ondemand2";
  if ($sort != "text") {
    $adjacents = 3;

    $count_query = "SELECT COUNT(*) as num FROM $tbl_name";
    $total_pages = mysql_fetch_array(mysql_query($count_query));
    $total_pages = $total_pages[num];

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
    if ($sort == "date") {
      $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, id, image, headline, note, songs, audio_url FROM $tbl_name  WHERE deleted = 'no' ORDER BY date DESC LIMIT $start, $limit";
    } else {
      $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, id, image, headline, note, songs, audio_url FROM $tbl_name  WHERE deleted = 'no' ORDER BY headline LIMIT $start, $limit";
    }
    $result = mysql_query($query);

    if (!$result) {
      echo "error: ". $query;
      die('Invalid');
    }

    /* Setup page vars for display. */
    if ($page == 0) $page = 1;					      //if no page var is given, default to 1.
    $prev = $page - 1;							          //previous page is page - 1
    $next = $page + 1;							          //next page is page + 1
    $lastpage = floor($total_pages/$limit);		//lastpage is = total pages / items per page, rounded down
    $lpm1 = $lastpage - 1;						        //last page minus 1

    echo '<table class="ondemand">';
    for ($i=1; $i<=mysql_num_rows($result);$i++)
    {
      $info = mysql_fetch_assoc($result);
      on_demand_player($info['id']);
    }	
    echo '</table>';			

    echo paginate($lastpage, $targetpage, $adjacents, $page, $lpm1);
  } //end of if not text
  else
  {
    $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, id, headline FROM $tbl_name WHERE deleted = 'no' ORDER BY headline, date DESC";
    $result = mysql_query($query);

    if (!$result) {
      echo "error: ". $query;
      die('Invalid');
    }

    echo '<table class="ondemand">';
    for ($i=1; $i<=mysql_num_rows($result);$i++)
    {
      $info = mysql_fetch_assoc($result);
      echo "<tr>\n<td>\n<a href=\"ondemand.php?id=". $info['id']. "\">". $info['headline'] ."\n( ". $info['fdate']." )</a></td>\n</tr>\n";			
    }	
    echo '</table>';
  } //end of else sort == text
} //end of function

function on_demand_player($id) {
  $query = "SELECT DATE_FORMAT(date, '%m/%d/%y' ) as fdate, image, headline, note, songs, audio_url, source FROM ondemand2 WHERE id = $id";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }

  for ($i=1; $i<=mysql_num_rows($result);$i++)
  {
    $info = mysql_fetch_assoc($result);
    echo "<tr>\n<td><img src=\"" . $info['image']. "\"></td>\n".
      "<td>\n<div class='t'><strong>". $info['headline']."</strong></div>\n".
      "<div>". $info['note']. "</div>\n".
      "<div>Songs Performed: ".$info['songs']. "</div>\n".
      "<div>Recorded: ".$info['fdate']. "</div>\n".
      "<div><iframe src=\"https://www.opendrive.com/listen/". $info['audio_url'] ."\" height=\"25\" width=\"370\" style=\"border:0\" scrolling=\"no\" frameborder=\"0\" allowtransparency=\"true\"></iframe>\n</div>\n</tr>";
  }	
}

function paginate($lastpage, $targetpage, $adjacents, $page, $lpm1){
  $pagination = "";
  if($lastpage > 1)
  {	
    $pagination .= "<div class=\"pagination center\">";
    //previous button
    if ($page > 1)
      $pagination.= "<a href=\"$targetpage&page=$prev\">« previous</a>";
    else
      $pagination.= "<span class=\"disabled\">« previous</span>";	

    //pages	
    if ($lastpage < 7 + ($adjacents * 2))	//not enough pages to bother breaking it up
    {	
      for ($counter = 1; $counter <= $lastpage; $counter++)
      {
        if ($counter == $page)
          $pagination.= "<span class=\"current\">$counter</span>";
        else
          $pagination.= "<a href=\"$targetpage&page=$counter\">$counter</a>";					
      }
    }
    elseif($lastpage > 5 + ($adjacents * 2))	//enough pages to hide some
    {
      //close to beginning; only hide later pages
      if($page < 1 + ($adjacents * 2))		
      {
        for ($counter = 1; $counter < 4 + ($adjacents * 2); $counter++)
        {
          if ($counter == $page)
            $pagination.= "<span class=\"current\">$counter</span>";
          else
            $pagination.= "<a href=\"$targetpage&page=$counter\">$counter</a>";					
        }
        $pagination.= "...";
        $pagination.= "<a href=\"$targetpage&page=$lpm1\">$lpm1</a>";
        $pagination.= "<a href=\"$targetpage&page=$lastpage\">$lastpage</a>";		
      }
      //in middle; hide some front and some back
      elseif($lastpage - ($adjacents * 2) > $page && $page > ($adjacents * 2))
      {
        $pagination.= "<a href=\"$targetpage&page=1\">1</a>";
        $pagination.= "<a href=\"$targetpage&page=2\">2</a>";
        $pagination.= "...";
        for ($counter = $page - $adjacents; $counter <= $page + $adjacents; $counter++)
        {
          if ($counter == $page)
            $pagination.= "<span class=\"current\">$counter</span>";
          else
            $pagination.= "<a href=\"$targetpage&page=$counter\">$counter</a>";					
        }
        $pagination.= "...";
        $pagination.= "<a href=\"$targetpage&page=$lpm1\">$lpm1</a>";
        $pagination.= "<a href=\"$targetpage&page=$lastpage\">$lastpage</a>";		
      }
      //close to end; only hide early pages
      else
      {
        $pagination.= "<a href=\"$targetpage&page=1\">1</a>";
        $pagination.= "<a href=\"$targetpage&page=2\">2</a>";
        $pagination.= "...";
        for ($counter = $lastpage - (2 + ($adjacents * 2)); $counter <= $lastpage; $counter++)
        {
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

?>
