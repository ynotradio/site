<?php

include 'partials/_auth0.php';

$auth0->logout();
$return_to = 'http://' . $_SERVER['HTTP_HOST'];
$logout_url = sprintf('http://%s/v2/logout?client_id=%s&returnTo=%s', 'ynotradio.us.auth0.com', 'O2mtONPEhbuEkZw3yOmzfBlBqzUptR2I', $return_to);
header('Location: ' . $logout_url);
die();
