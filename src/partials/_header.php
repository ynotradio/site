<?php

if ($page_file != "logout.php"){
  login_check();
}
#error_reporting( E_ALL);
#ini_set('display_errors', '1 ');

?>
<!DOCTYPE hmtl PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
      <meta http-equiv="Content-Language" content="en-us"/>
      <meta name="description" content="YNot Radio" />
      <meta name="keywords" content="Y-Not Radio, ynot radio, y-not, ynot, Y-Not Philly, ynot philly, Y100, Y100 Philadelphia, Y100 Philly, y100 rocks, Philadelphia music, Philly music, indie rock, Josh T. Landow, Josh Landow" />
      <meta name="author" content="YNot Radio" />
      <title><?php if ($page_title) { echo "$page_title | "; } ?> Y-Not Radio </title>
      <link rel="shortcut icon" href="/imgs/favicon.ico" />

      <!-- social meta start -->
      <meta property="og:site_name" content="YNot Radio">
      <meta property="og:image" content="http://www.ynotradio.net/imgs/ynot-fb.jpg">
      <meta property="og:title" content="YNot Radio">
      <meta property="og:description" content="YNot Radio | Philadelphia's Real Alternative">
      <meta property="og:type" content="article">
      <meta property="og:url" content="http://www.ynotradio.net">
      <!-- social meta end -->
    <!--[if lte IE 8]>
    <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
      <link href="style/base.css" rel="stylesheet" type="text/css" media="all">
      
      <!-- <script type="text/javascript" src="js/jquery-1.7.1.js"></script> -->
      <script type="text/javascript" src="http://code.jquery.com/jquery-1.7.1.min.js"></script>
      <!--http://code.jquery.com/jquery-1.7.1.min.js -->

      <script src="js/picker.js"></script>
      <script src="js/picker.date.js"></script>
      <script src="js/picker.time.js"></script>
      <script src="js/legacy.js"></script>
      <script src="js/init.js"></script>
      <?php if ($page_file == "madness.php" || $page_file == "mrm_manage_matches.php")
        echo "<script type=\"text/javascript\" src=\"js/countdown.js\"></script>";
      ?>
      <?php if ($page_file == "mrm_manage_matches.php")
        echo "<script type=\"text/javascript\" src=\"js/admin_madness.js\"></script>";
      ?>
      <?php if ($page_file == "yearendpoll.php") 
        echo "<script type=\"text/javascript\" src=\"js/year_end_poll.js\"></script>";
      ?>
      <?php require("js/common_functions.js"); ?>

    </head>
    <?php
      if ($page_file == "yearendpoll.php")
        echo "<body onload=\"init()\">";
      else
        echo "<body>";
    ?>
      <div id="fb-root"></div>
      <script>(function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=272336702790140";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));</script>
      <div id="container">
      <header>
        <img src="imgs/header_front.png" alt="logo" usemap="#Map"/>
        <iframe src="http://www.iradiophilly.com/ynotplaying.php" name="iradiophillyplaylist" scrolling="no" noresize="" frameborder="No" marginwidth="0" marginheight="0" width="445" height="125"></iframe>
        <map name="Map">
          <area shape="rect" coords="20,5,310,150" href="http://www.ynotradio.net" alt="Y-Not Radio"/>
          <area shape="rect" coords="340,10,452,85" href="http://www.iradiophilly.com/index.php?idStation=42" alt="Listen Live" target="_blank"/>
          <area shape="rect" coords="337,93,447,102" href=" http://www.iradiophilly.com/pls/ynot.pls" target="_blank" alt="iTunes">
          <area shape="rect" coords="328,115,372,149" href="https://www.facebook.com/ynotradio" alt="facebook" target="_blank"/>
          <area shape="rect" coords="382,115,410,149" href="http://twitter.com/ynotradio" alt="twitter" target="_blank"/>
          <area shape="rect" coords="414,115,447,149" href="mobile.php" alt="mobile"/>
        </map>
      <?php
        $on_air = on_air();
        if ($on_air != '')
          echo "<div id=\"on-air\">".$on_air."</div>";
      ?>
      </header>
      <nav>
        <ul>
        <?php
          $nav = array("index.php" => "Home", "concerts.php" => "Concerts", "top11.php" => "Top 11 @ 11", "music.php" => "New Music", "schedule.php" => "Schedule", "deejays.php" => "Dee Jays", "ondemand.php" => "On Demand", "cdoftheweek.php" => "CD of The Week", "ymail.php" => "Y-Mail", "donate.php" => "Donate");
      foreach ($nav as $url => $title) {
          $last_class = '';
          if (end($nav) == $title) $last_class = "class =\"last\""; //silly IE Hack for last
          if ($url == $page_file)
            echo "<li $last_class><a href=\"$url\" class=\"active\">$title</a></li>\n";
          else
            echo "<li $last_class><a href=\"$url\">$title</a></li>\n";
          }
        ?>
        </ul>
      </nav>
