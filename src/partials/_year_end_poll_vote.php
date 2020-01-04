<?php
  $poll_values = get_values($current_poll);
  $category = ucwords(str_replace("_", " ", $current_poll));
  $column_names = get_column_names($current_poll);

  echo "<h2 class=\"center top-spacer_20\">" . format_poll_header($current_poll, $category) ."</h2>\n
    <form action=\"yearendpoll.php\" method=\"post\" name=\"year_end_". $current_poll ."\" class=\"form-default\">
    <fieldset>\n<div class=\"control-group\">\n<div class=\"controls\">\n";

  for ($i=1; $i<=mysqli_num_rows($poll_values); $i++) {
    $info = mysqli_fetch_assoc($poll_values);
    echo "<label for=\"".$info['id']."\" class=\"half\"><input type=\"checkbox\" name=\"year_end_votes[]\" id=\"".$info['id']."\" value=\"".$info['id']."\">";
    for ($c=1; $c<=count($column_names)-2; $c++) {
        
        echo "<span>" . $info[$column_names[$c]];
        if ($column_names[$c+1] != 'votes' && $info[$column_names[$c+1]] !== '')
          echo " - ";
      
     
    }
    echo "\n</span>\n</label>\n";
  }
  echo "</div>\n<div class=\"control-group top-spacer_20\">\n
    <div class=\"controls\">\n
    <input type=\"checkbox\" id=\"song_write_in\"> <input type=\"text\" disabled=\"disabled\" class=\"input-xl\" id=\"write_in_value\" name=\"write_in_value\">\n
    <div class=\"form-other\">Other (please specify)</div>\n</div>\n</div>\n
    </div>\n<div class=\"form-actions\">\n<button class=\"btn-info disabled\" type=\"submit\" disabled=\"disabled\" id=\"vote\">Pick " . max_picks_for($current_poll) . " more!</button>\n
    <input type=\"hidden\" name=\"poll\" value=". $current_poll .">\n</div>\n
    </form>\n</div>\n</fieldset>";
?>
