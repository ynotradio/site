<?php
require 'vendor/autoload.php';
require 'partials/__env_loader.php';

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$configuration = new Auth0\SDK\Configuration\SdkConfiguration([
    'strategy' => 'webapp',
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'clientId' => $_ENV['AUTH0_CLIENT_ID'],
    'clientSecret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirectUri' => $protocol . "://" . $uri,
    'scope' => ['openid', 'profile', 'email'],
    'cookieSecret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'cookieSecure' => false,
    'cookieDomain' => $uri
]);

$auth0 = new Auth0\SDK\Auth0($configuration);
$auth0->logout();
$return_to = $protocol . '://' . $uri;
$logout_url = sprintf('https://%s/v2/logout?client_id=%s&returnTo=%s', $_ENV['AUTH0_DOMAIN'], $_ENV['AUTH0_CLIENT_ID'], $return_to);
header('Location: ' . $logout_url);
