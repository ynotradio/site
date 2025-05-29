<?php
require_once "models/AdFactory.php";
require_once "models/ConcertFactory.php";

use YNotRadio\Models\AdFactory;
use YNotRadio\Models\ConcertFactory;

// Display ads
$adModel = AdFactory::create(open_db());
$currentAds = $adModel->getCurrent();

if (count($currentAds) > 0) {
    echo "<div class=\"feature-box\">\n";
    echo "<h3>Sponsors</h3><p>\n";
    
    foreach ($currentAds as $ad) {
        echo 
            "<div>".
                "<a href=\"" . $ad['web_url']. "\" target=_new>" .
                "<img src=\"" . $ad['pic_url']. "\" alt=\"".$ad['name']. "\" border=\"0\">" .
                "</a>" .
            "</div>\n";
    }
    
    echo "</div>";
}

// Display featured concerts
$concertModel = ConcertFactory::create(open_db());
$featuredConcerts = $concertModel->getFeatured(5);

if (count($featuredConcerts) > 0) {
    echo "<div class=\"feature-box\">";
    echo "<h3>Featured Concerts</h3><p>\n";
    
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
    
    echo "</div>";
}

if (count($featuredConcerts) > 0) {
    echo "<div class=\"feature-box\">";
    echo "<h3>Featured Concerts</h3><p>\n";
    
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
    
    echo "</div>";
}
?>
<div class="feature-box">
<h3>Follow Y-Not Radio on MixCloud</h3>
  <iframe width="218" height="250" src="https://www.mixcloud.com/widget/follow/?dark=1&amp;u=%2Fynotradio%2F&amp;hide_followers=1" frameborder="0"></iframe>
</div>
