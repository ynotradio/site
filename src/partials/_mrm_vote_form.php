<?php
/**
 * Vote form partial for Modern Rock Madness
 * 
 * @param int $match_id The ID of the match to vote in
 * @param int $band_id The ID of the band (1 or 2)
 * @param \Auth0\SDK\Auth0|null $auth0 Auth0 instance (optional)
 */

// Use provided auth0 instance or global one
$auth0 = $auth0 ?? $GLOBALS['auth0'] ?? null;

// Check if user is authenticated
$userInfo = $auth0 ? $auth0->getUser() : null;
$voter_email = $userInfo['email'] ?? null;

if (empty($voter_email)) {
    // User is not logged in - show login button
    echo '<a href="auth_login.php?returnTo=/madness" class="btn-success">Log in to vote</a>';
} else {
    // User is logged in - show vote form
    echo '<form action="madness.php" method="post">
        <input type="submit" class="btn-success" value="Vote!">
        <input type="hidden" name="match_id" value="' . htmlspecialchars($match_id) . '">
        <input type="hidden" name="band_id" value="' . htmlspecialchars($band_id) . '">
        <input type="hidden" name="voter_email" value="' . htmlspecialchars($voter_email) . '">
    </form>';
}
