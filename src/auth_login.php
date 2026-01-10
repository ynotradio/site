<?php
/**
 * Generic Auth0 Login Handler
 * 
 * This file handles Auth0 authentication for all voting features:
 * - Top 11 @ 11
 * - Modern Rock Madness
 * - Year End Poll
 * 
 * Usage: auth_login.php?returnTo=/top11
 */

$page_file = "auth_login.php";
$page_title = "Login";

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

// Build full redirect URL
$redirectUri = $protocol . "://" . $uri . $returnTo;

$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $redirectUri,
    'scope' => 'openid email profile',
]);

$auth0->login();
