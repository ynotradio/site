<?php
$page_file = "social_login.php";
$page_title = "Social Login";

require 'vendor/autoload.php';
require 'partials/__env_loader.php';

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$configuration = new Auth0\SDK\Configuration\SdkConfiguration([
    'strategy' => 'webapp',
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'clientId' => $_ENV['AUTH0_CLIENT_ID'],
    'clientSecret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirectUri' => $protocol . "://" . $uri . "/madness",
    'scope' => ['openid', 'profile', 'email'],
    'cookieSecret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'cookieSecure' => false,
    'cookieDomain' => $uri
]);

$auth0 = new Auth0\SDK\Auth0($configuration);
$auth0->login();
