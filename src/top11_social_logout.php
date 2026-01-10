<?php
$page_file = "top11_social_logout.php";
$page_title = "Top 11 Logout";

require 'vendor/autoload.php';
require 'partials/__env_loader.php';

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $protocol . "://" . $uri . "/top11",
    'scope' => 'openid email profile',
]);

// Clear local Auth0 session
$auth0->logout();

// Build Auth0 logout URL using SDK method and redirect
$returnTo = $protocol . "://" . $uri . "/top11";
$logoutUrl = $auth0->getAuthenticationClient()->get_logout_link($returnTo, $_ENV['AUTH0_CLIENT_ID']);

header('Location: ' . $logoutUrl);
exit();