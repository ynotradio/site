<?php
/**
 * Top 11 @ 11 Logout Redirect
 * Redirects to generic auth_logout.php handler
 */
header('Location: /auth_logout.php?returnTo=/top11');
exit();