<?php
require_once "models/AdFactory.php";

use YNotRadio\Models\AdFactory;

// Display ads
$adModel = AdFactory::create(open_db());
$currentAds = $adModel->getCurrent();

if (count($currentAds) > 0) {
    echo "<div class=\"feature-box ads\">\n";

    foreach ($currentAds as $ad) {
        echo
        "<div>" .
            "<a href=\"" . $ad['web_url'] . "\" target=_new>" .
            "<img src=\"" . $ad['pic_url'] . "\" alt=\"" . $ad['name'] . "\" border=\"0\">" .
            "</a>" .
            "</div>\n";
    }

    echo "</div>";
}
?>
<div class="feature-box">
    <h3>Follow Y-Not Radio on MixCloud</h3>
    <iframe width="218" height="250" src="https://www.mixcloud.com/widget/follow/?dark=1&amp;u=%2Fynotradio%2F&amp;hide_followers=1" frameborder="0"></iframe>
</div>
