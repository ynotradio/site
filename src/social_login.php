<?php
/**
 * Modern Rock Madness Login Redirect
 * Redirects to generic auth_login.php handler
 */
header('Location: /auth_login.php?returnTo=/madness');
exit();
