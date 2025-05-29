<?php
require_once "models/AdFactory.php";
require_once "models/ConcertFactory.php";

use YNotRadio\Models\AdFactory;
use YNotRadio\Models\ConcertFactory;

// Display ads
$adModel = AdFactory::create(open_db());
$currentAds = $adModel->getCurrent();

echo "<div class=\"feature-box\">\n";
echo "<h3>Sponsors</h3><p>\n";

if (count($currentAds) > 0) {
    foreach ($currentAds as $ad) {
        echo 
            "<div class=\"sponsor\">".
                "<a href=\"" . $ad['web_url']. "\" target=_new>" .
                "<img src=\"" . $ad['pic_url']. "\" alt=\"".$ad['name']. "\" border=\"0\">" .
                "</a>" .
            "</div>\n";
    }
} else {
    echo "<p>Interested in becoming a sponsor? <a href=\"contact.php\">Contact us</a>!</p>";
}

echo "</div>";

// Display featured concerts
$concertModel = ConcertFactory::create(open_db());
$featuredConcerts = $concertModel->getFeatured(5);

echo "<div class=\"feature-box\">";
echo "<h3>Featured Concerts</h3><p>\n";

if (count($featuredConcerts) > 0) {
    foreach ($featuredConcerts as $concert) {
        $fdate = date('D F jS', strtotime($concert['date']));
        echo 
            "<div class=\"featured_concert\">".
                "<div class=\"artist\">". $concert['artist']. "</div>\n";
        
        if (!empty($concert['band_pic_url'])) {
            echo "<div><img src=\"". $concert['band_pic_url']. "\" alt=\"".$concert['artist']. "\" border=\"1\" height='100px';></div>\n";
        } else {
            echo "<div><img src=\"imgs/na.jpg\" alt=\"".$concert['artist']. "\" border=\"1\" height='100px';></div>\n";
        }
        
        echo "<div>" . $fdate . "</div>\n".
            "<div><a href=\"" . $concert['ticketurl']. "\" target=_new>" . $concert['venue']. "</a></div>\n".
            "</div>\n";
    }
} else {
    echo "Welcome to the all new Y-Not Radio. You've discovered the station that carries on the legacy of Y100, Y100Rocks, and WDRE. Y-Not Radio is run by former Y-Rock Operations Director Josh T. Landow along with hosts Adrienne, Andre, Brendan McNulty, Cat, Heather, Jeff St. Pierre, Joey O., Liz Romaine, Matt McGrath, Matt Summers, Rafe Pilling, Ramon, and Rob Huff, plus some new voices as well. Together we will continue to bring you the high quality alternative, modern, and indie rock programming that we always have. Thanks for joining us!";
}

echo "</div>";
?>
<div class="feature-box">
<h3>Follow Y-Not Radio on MixCloud</h3>
  <iframe width="218" height="250" src="https://www.mixcloud.com/widget/follow/?dark=1&amp;u=%2Fynotradio%2F&amp;hide_followers=1" frameborder="0"></iframe>
</div>
