 <?php
// Define base_path if not already defined
if (!isset($base_path)) {
    $base_path = (strpos($page_file, 'cp/') !== false || dirname($_SERVER['PHP_SELF']) == '/cp') ? "../" : "";
}

// Try to find the autoload.php file in various locations
$autoload_paths = [
    $base_path . 'vendor/autoload.php',
    dirname(__FILE__) . '/../vendor/autoload.php',
    dirname(__FILE__) . '/../../vendor/autoload.php'
];

$autoload_loaded = false;
foreach ($autoload_paths as $autoload_path) {
    if (file_exists($autoload_path)) {
        require_once $autoload_path;
        $autoload_loaded = true;
        break;
    }
}

// Load the environment file
require_once __DIR__ . '/../__env_loader.php';

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $protocol . "://" . $uri,
    // The scope determines what data is provided in the ID token.
     // See: https://auth0.com/docs/scopes/current
     'scope' => 'openid email profile',
]);
$userInfo = $auth0->getUser();

?>
  </div>
    <footer>
    Copyright <?php echo date('Y'); ?> Y-Not Radio
      <br>
      <?php 
      // Define base_path if it's not already defined (in case footer is included directly)
      if (!isset($base_path)) {
          $base_path = (strpos($page_file, 'cp/') !== false || dirname($_SERVER['PHP_SELF']) == '/cp') ? "../" : "";
      }
      ?>
      <a href="/aboutus.php">About Us</a> | <a href="/contact.php">Contact</a>
      <?php

if ($userInfo) {
    ?>
| <a href="/auth_logout.php?returnTo=/madness">Log out</a>
        <?php
}
?>
  </footer>
  <?php mysqli_close(open_db()); ?>
  <!--- 🔔🔔🔔🔔 From Philadelphia, to the WORLD. 🌎🌎🌎🌎 -->
  </body>
</html>
