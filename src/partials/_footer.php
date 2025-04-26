<?php
// Use absolute path to vendor directory
$root_path = $_SERVER['DOCUMENT_ROOT'];
$vendor_autoload = $root_path . '/vendor/autoload.php';
$env_loader = dirname(__FILE__) . '/__env_loader.php';

// Check if files exist before requiring them
if (file_exists($vendor_autoload)) {
    require $vendor_autoload;
} else {
    error_log("Unable to load vendor/autoload.php from {$vendor_autoload}");
}

if (file_exists($env_loader)) {
    require $env_loader;
} else {
    error_log("Unable to load __env_loader.php");
}

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

// Only initialize Auth0 if autoload was successful and required env vars are present
$userInfo = null;
if (class_exists('Auth0\SDK\Auth0') && 
    !empty($_ENV['AUTH0_DOMAIN']) && 
    !empty($_ENV['AUTH0_CLIENT_ID']) && 
    !empty($_ENV['AUTH0_CLIENT_SECRET'])) {
    try {
        $auth0 = new Auth0\SDK\Auth0([
            'domain' => $_ENV['AUTH0_DOMAIN'],
            'client_id' => $_ENV['AUTH0_CLIENT_ID'],
            'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
            'redirect_uri' => $protocol . "://" . $uri,
            'scope' => 'openid email profile',
        ]);
        $userInfo = $auth0->getUser();
    } catch (\Exception $e) {
        error_log('Auth0 initialization error: ' . $e->getMessage());
    }
}

?>
  </div>
    <footer>
    Copyright <?php echo date('Y'); ?> Y-Not Radio
      <br>
      <a href="/aboutus.php">About Us</a> | <a href="/contact.php">Contact</a>
      <?php if ($userInfo) { ?>
        | <a href="/social_logout.php">Log out</a>
      <?php } ?>
  </footer>
  <?php 
  // Check if function exists before calling
  if (function_exists('open_db')) { 
      mysqli_close(open_db()); 
  } 
  ?>
  </body>
</html>
