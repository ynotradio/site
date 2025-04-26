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

require_once $root_path . '/functions/Auth0Service.php';

$userInfo = null;
if (class_exists('Auth0\SDK\Auth0')) {
    try {
        $userInfo = Auth0Service::getInstance()->getUser();
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
