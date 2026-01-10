<?php
/**
 * Modern Rock Madness Logout Redirect
 * Redirects to generic auth_logout.php handler
 */
header('Location: /auth_logout.php?returnTo=/madness');
exit();
