<?php
$page_file = "top11_social_login.php";
$page_title = "Top 11 Login";

require 'vendor/autoload.php';
require 'partials/__env_loader.php';

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $protocol . "://" . $uri . "/top11",
    // The scope determines what data is provided in the ID token.
     // See: https://auth0.com/docs/scopes/current
     'scope' => 'openid email profile',
]);

$auth0->login();