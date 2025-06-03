<?php
// Helper functions for displaying on demand entries, maintained for compatibility
// These could be integrated into templates in a future update

function display_on_demand($ondemand) {
  echo "<br><b>Headline: </b>". $ondemand['headline'].
    "<br><b>Songs Performed: </b>". $ondemand['songs'].
    "<br><b>Note: </b>". $ondemand['note'].
    "<br><b>Image: </b><br><img src=\"". $ondemand['image']. "\"height=100px> ".
    "<br><b>Date: </b>". $ondemand['date'].
    "<br><b>Audio ID: </b>". $ondemand['audio_url'];
}

function on_demand_player($id) {
  global $onDemandModel;
  
  $cleanId = filter_var($id, FILTER_SANITIZE_NUMBER_INT);
  $entry = $onDemandModel->getById($cleanId);
  
  if (!$entry) {
    echo "<div class=\"center error\">Something went wrong, go back and try again.</div>";
  } else {
    $date = new DateTime($entry['date']);
    $formattedDate = $date->format('m/d/y');
    
    echo "<tr>\n<td><img src=\"" . $entry['image']. "\"></td>\n".
      "<td>\n<div class='t'><strong>". $entry['headline']."</strong></div>\n".
      "<div>". $entry['note']. "</div>\n".
      "<div>Songs Performed: ".$entry['songs']. "</div>\n".
      "<div>Date: ".$formattedDate. "</div>\n".
      "<div><iframe src=\"https://www.opendrive.com/player/". $entry['audio_url'] ."\" height=\"40\" width=\"370\" style=\"border:0\" scrolling=\"no\" frameborder=\"0\" allowtransparency=\"true\"></iframe>\n</div>\n</tr>";
  }
}

function paginate($lastpage, $targetpage, $adjacents, $page, $lpm1) {
  $pagination = "";
  $prev = $page - 1;                            //previous page is page - 1
  $next = $page + 1;                            //next page is page + 1

  if($lastpage > 1) {
    $pagination .= "<div class=\"pagination center\">";
    //previous button
    if ($page > 1)
      $pagination.= "<a href=\"$targetpage&page=$prev\">« previous</a>";
    else
      $pagination.= "<span class=\"disabled\">« previous</span>";

    //pages
    if ($lastpage < 7 + ($adjacents * 2)) {
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
