<?php

$page_file = "top11.php";
$page_title = "Top 11 @ 11";

require 'vendor/autoload.php';
require 'partials/__env_loader.php';

// Initialize Auth0 BEFORE any output
$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$auth0 = new Auth0\SDK\Auth0([
  'domain' => $_ENV['AUTH0_DOMAIN'],
  'client_id' => $_ENV['AUTH0_CLIENT_ID'],
  'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
  'redirect_uri' => $protocol . "://" . $uri . "/top11",
  'scope' => 'openid email profile',
]);

require("functions/main_fns.php");
require_once("models/Top11Factory.php");
require("partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Top 11 @ 11</h1>
    <?php
    if ($_POST['action']) {
      require("partials/_top11_save.php");
    } else {
      // Display Top11 message
      $message = $top11Model->getMessage();
      echo "<div class=\"top11-message full_height\">
          <img src=\"imgs/knob_11.jpg\" alt=\"Top 11\" /></td>
          <td id=\"top11message\">" . $message['message'] .
        "</div>";

      // Show Top11 list
      $top11Entries = $top11Model->getAll();
      $titleEntry = null;

      foreach ($top11Entries as $entry) {
        if ($entry['placement'] == 99) {
          $titleEntry = $entry;
          break;
        }
      }

      echo "<h2 class=\"center\">Top 11 @ 11 for " . $titleEntry['artist'] . "</h2>\n";
      echo "<table class='table table-striped table-bordered-horizontal table-condensed no-header table-center'>";

      foreach ($top11Entries as $entry) {
        if ($entry['placement'] != 99 && $entry['placement'] != 98) {
          echo "<tr>\n<td>" . $entry['placement'] . " </td>\n" .
            "<td>" . $entry['artist'] . "</td>\n" .
            "<td>" . $entry['song'] . "</td>\n" .
            "<td>" . $entry['note'] . "</td>\n" .
            "</tr>\n";
        }
      }
      echo "</table>\n";

      // Check if voting is open
      if ($top11Model->getStatus() == "open") {
        // Check if user is authenticated
        $userInfo = $auth0->getUser();
        $voter_email = $userInfo['email'] ?? null;

        if (empty($voter_email)) {
          // User is not logged in - show login button
          echo "<h2 class=\"center\">Vote for Your Top 3 Y-Not Songs of the Week</h2>\n";
          echo "<div class=\"information center top-spacer_20\">";
          echo "<p><strong>Please log in to vote in the Top 11 @ 11.</strong></p>";
          echo "<a href=\"top11_social_login.php\" class=\"btn-success\">Log in to Vote</a>";
          echo "</div>";
        } else if ($top11Model->hasUserVotedThisWeek($voter_email, $userInfo['sub'] ?? null)) {
          // User has already voted this week
          echo "<h2 class=\"center\">Vote for Your Top 3 Y-Not Songs of the Week</h2>\n";
          echo "<div class=\"information center top-spacer_20\">";
          echo "<p><strong>Thank you for voting!</strong></p>";
          echo "<p>You have already voted in this week's Top 11 @ 11. Each user can only vote once per week.</p>";
          echo "<p>Check back next week to vote again!</p>";
          echo "<a href=\"top11_social_logout.php\" class=\"btn-info\">Log out</a>";
          echo "</div>";
        } else {
          // User is logged in and hasn't voted - show voting form
          $songs = $top11Model->getAllSongs();
          echo "<h2 class=\"center\">Vote for Your Top 3 Y-Not Songs of the Week</h2>\n";
          echo "<div class=\"information center\">Logged in as: <strong>" . htmlspecialchars($voter_email) . "</strong> | <a href=\"top11_social_logout.php\">Log out</a></div>";
          echo "<form action=" . $page_file . " method=\"post\" name=\"top11\" class=\"form-default\">
              <fieldset>\n<div class=\"control-group\">\n<div class=\"controls\">\n";

          foreach ($songs as $song) {
            echo "<label for=\"" . $song['id'] . "\" class=\"half\"><input type=\"checkbox\" name=\"top11[]\" id=\"" . $song['id'] . "\" value=\"" . $song['id'] . "\">" .
              "<span class=\"top11_entry\"> " . $song['artist'] . " - " . $song['song'] . "\n</span>\n</label>\n";
          }

          echo "</div></div>\n<div class=\"control-group\">\n<div class=\"controls\">\n";
          echo "<input type=\"checkbox\" id=\"top11_write_in\"> <input type=\"text\" disabled=\"disabled\" class=\"input-xl\" id=\"write_in_value\" name=\"write_in_value\">\n" .
            "<div class=\"form-other\">Other (please specify)</div>\n</div>\n</div>\n";

          echo "<div class=\"control-group top-spacer_20 input-seperation\">\n" .
            "<label>Would you like to be entered into this week's contest?</label>\n" .
            "<div class=\"controls inline clearfix\"><label for=\"yes\"><input type=\"radio\" name=\"contest\" id=\"yes\" value=\"yes\" />Yes</label>" .
            "<label for=\"no\"><input type=\"radio\" name=\"contest\" id=\"no\" value=\"no\" />No</label></div>\n" .
            "<label>Would you like to receive Y-Not Radio's weekly Y-Mail newsletter?</label>\n" .
            "<div class=\"controls inline clearfix\"><label for=\"newsletter-yes\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-yes\" value=\"yes\" />Yes</label>" .
            "<label for=\"newsletter-no\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-no\" value=\"no\" />No</label>" .
            "<label for=\"newsletter-already\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-already\" value=\"already\" />I Already Receive It</label></div>\n" .
            "<div class=\"form-actions\"><button class=\"btn-info\" type=\"submit\">Cast Your Vote</button>\n" .
            "<input type=\"hidden\" name=\"action\" value=\"write\">" .
            "<input type=\"hidden\" name=\"voter_email\" value=\"" . htmlspecialchars($voter_email) . "\">" .
            "<input type=\"hidden\" name=\"auth0_id\" value=\"" . htmlspecialchars($userInfo['sub'] ?? '') . "\"></div>" .
            "</form>\n</div>\n</fieldset>";
        }
      } else {
        echo "<div class=\"information center\">Sorry but voting is currently closed.
                <br>
                Check back soon to vote for next week's Top 11 @ 11</div>";
      }
    }
    ?>
  </div>
  <div class="three columns"><?php require("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require("partials/_footer.php"); ?>
