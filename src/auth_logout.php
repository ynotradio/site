<?php
/**
 * Generic Auth0 Logout Handler
 * 
 * This file handles Auth0 logout for all voting features:
 * - Top 11 @ 11
 * - Modern Rock Madness
 * - Year End Poll
 * 
 * Usage: auth_logout.php?returnTo=/top11
 */

$page_file = "auth_logout.php";
$page_title = "Logout";

require 'vendor/autoload.php';
require 'partials/__env_loader.php';

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

// Get return URL from query parameter, default to home page
$returnTo = isset($_GET['returnTo']) ? $_GET['returnTo'] : '/';

// Validate returnTo is a relative path to prevent open redirect
if (!empty($returnTo) && $returnTo[0] !== '/') {
    $returnTo = '/';
}

// Build full return URL
$returnToUrl = $protocol . "://" . $uri . $returnTo;

$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $returnToUrl,
    'scope' => 'openid email profile',
]);

// Clear local Auth0 session
$auth0->logout();

// Build Auth0 logout URL using Authentication API
$authentication = new Auth0\SDK\API\Authentication(
    $_ENV['AUTH0_DOMAIN'],
    $_ENV['AUTH0_CLIENT_ID'],
    $_ENV['AUTH0_CLIENT_SECRET']
);

// Build logout URL without federated flag to keep user logged into identity provider (Google, etc)
$logoutUrl = $authentication->get_logout_link($returnToUrl, $_ENV['AUTH0_CLIENT_ID'], false);

header('Location: ' . $logoutUrl);
exit();
