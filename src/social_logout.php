<?php

require 'vendor/autoload.php';
require 'partials/__env_loader.php';

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $protocol . "://" . $uri,
    // The scope determines what data is provided in the ID token.
     // See: https://auth0.com/docs/scopes/current
     'scope' => 'openid email profile',
]);

$auth0->logout();
$return_to = 'http://' . $uri;
$logout_url = sprintf('http://%s/v2/logout?client_id=%s&returnTo=%s', 'ynotradio.us.auth0.com', 'O2mtONPEhbuEkZw3yOmzfBlBqzUptR2I', $return_to);
header('Location: ' . $logout_url);
die();
