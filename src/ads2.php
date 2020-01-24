<?php
require ("ext/ads_fns.php");
echo "<br><div id=\"social\"><a href=\"http://www.facebook.com/ynotradio\" target=_new><img src=\"\imgs\\facebook.jpg\" height=\"50\" ></a> ".
"<a href=\"http://www.twitter.com/ynotradio\"  target=_new> <img src=\"\imgs\\twitter.jpg\" height=\"50\" ></a> ".
"<a href=\"mobile.php\"><img src=\"\imgs\\iphone.png\" height=\"50\"></a></div>";
echo "<div id='sponsor'>";
show_ads();
echo"</div>";
echo "<h3>Featured Concerts</h3><p>\n";
featured_concerts();
?>