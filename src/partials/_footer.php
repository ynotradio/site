 <?php
require 'vendor/autoload.php';
require '__env_loader.php';

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
      <a href="/aboutus.php">About Us</a> | <a href="/contact.php">Contact</a>
      <?php

if ($userInfo) {
    ?>
| <a href="/social_logout.php">Log out</a>
        <?php
}
?>
  </footer>
  <?php mysqli_close(open_db()); ?>
  </body>
</html>
