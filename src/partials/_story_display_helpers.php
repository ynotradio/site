<?php
// Helper functions for displaying stories, maintained for compatibility
// These could be integrated into templates in a future update

function display_pic($pic_url, $pic_img) {
  if ($pic_url == "top11.php") {
    echo "<a href= \"". $pic_url . "\" ><img src=\"" . $pic_img . "\"></a>\n";
  } else {
    echo "<a href= \"". $pic_url . "\" target=_new ><img src=\"" . $pic_img . "\"></a>\n";
  }
}

function display_stories($stories) {
  for ($i=0; $i < sizeof($stories);$i++)
  {
    $info = $stories[$i];
    echo "<div class=\"feature-box\">" .
      "<h3>". $info['headline']. "</h3>\n";
    display_pic($info['pic_url'], $info['pic']);
    echo "<div class=\"clearfix\">" .$info['story'] . "</div>\n</div>";
  }
}

function display_story($story) {
     echo "<br><b>Headline: </b>". $story['headline'].
      "<br><b>Story: </b>". $story['story'].
      "<br><b>Start Date: </b>". $story['start_date'].
      "<br><b>End Date: </b>". $story['end_date'].
      "<br><b>Picture URL: </b>". $story['pic'].
      "<br><b>Picture Link URL: </b>". $story['pic_url'].
      "<br><b>Priority: </b>". $story['priority'];
}
