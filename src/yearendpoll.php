<?php

// Categories, copy and the voting window come from the Payload poll; voters
// log in with Auth0.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$page_file = "yearendpoll.php";
$page_title = "Year End Poll";

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/partials/__env_loader.php';

$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';
$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $protocol . "://" . $_SERVER["HTTP_HOST"] . "/yearendpoll.php",
    'scope' => 'openid email profile',
]);
$userInfo = $auth0->getUser();
$voterId = $userInfo['sub'] ?? '';
$voterEmail = $userInfo['email'] ?? '';

require_once __DIR__ . '/functions/main_fns.php';
require_once __DIR__ . '/controllers/YearEndPollController.php';

try {
    $controller = new \YNotRadio\Controllers\YearEndPollController();
    $pollInfo = $controller->getPollInfo();
} catch (\Throwable $err) {
    error_log("Year End Poll: " . $err->getMessage());
    http_response_code(503);
    require __DIR__ . '/partials/_header.php';
    echo '<div class="row"><div class="twelve columns"><h1>Year End Poll</h1>'
        . '<p>The Year End Poll is unavailable right now. Please try again in a few minutes.</p></div></div>';
    require __DIR__ . '/partials/_footer.php';
    exit;
}

// With no open or closed poll, send visitors to last year's results.
if ($pollInfo === null) {
    header("Location: pages.php?page=top225of2025");
    exit;
}

$isPollActive = $pollInfo['votingState'] === 'open';
$isPollUpcoming = $pollInfo['votingState'] === 'upcoming';

// Templates below take the voter key as $ip.
$ip = $voterId;
$currentPoll = $_GET['poll'] ?? null;
$voteSuccess = false;
$voteError = false;
$contestSuccess = false;
$contestError = false;

if ($isPollActive && $voterId !== '' && isset($_POST['poll'])) {
    $pollName = is_string($_POST['poll']) ? $_POST['poll'] : '';
    $votes = is_array($_POST['year_end_votes'] ?? null)
        ? array_values(array_filter($_POST['year_end_votes'], 'is_string'))
        : [];
    $writeInValue = is_string($_POST['write_in_value'] ?? null) ? trim($_POST['write_in_value']) : '';
    $voteCount = count($votes) + ($writeInValue !== '' ? 1 : 0);

    if (!in_array($pollName, $controller->getPollNames(), true)
        || $voteCount !== $controller->getMaxPicks($pollName)) {
        $voteError = true;
    } elseif (!$controller->hasVoted($ip, $pollName)) {
        $voteSuccess = $controller->processVotes($pollName, $votes, $ip, $writeInValue);
    }
}

if ($isPollActive && $voterId !== '' && isset($_POST['contest_form'])) {
    $field = fn (string $name): string => is_string($_POST[$name] ?? null) ? $_POST[$name] : '';
    $contestantData = [
        'name' => $field('name'),
        'email' => $voterEmail !== '' ? $voterEmail : $field('email'),
        'phone' => $field('phone'),
        'hometown' => $field('hometown'),
        'contest' => $field('contest'),
        'newsletter' => $field('newsletter'),
    ];

    if (in_array('', array_map('trim', $contestantData), true)) {
        $contestError = "missing_values";
    } elseif (!$controller->canEnterContest($ip)) {
        $contestError = true;
    } elseif (
        $controller->hasEnteredContest($ip)
        || $controller->hasEnteredContestByEmail($contestantData['email'])
        || $controller->hasEnteredContestByPhone($contestantData['phone'])
    ) {
        $contestError = "duplicate_entry";
    } else {
        $contestSuccess = $controller->processContestEntry($contestantData, $ip);
        $contestError = !$contestSuccess;
    }
}

require __DIR__ . '/partials/_header.php';
?>

<div class="row">
  <div class="twelve columns">
    <h1><?= htmlspecialchars($pollInfo['name']) ?></h1>

    <?php if ($isPollUpcoming): ?>
      <?= $pollInfo['introHtml'] ?>
      <div class="information center top-spacer_20">
        <p><strong>Voting opens <?= htmlspecialchars(date('l, F j', strtotime($pollInfo['opensAt']))) ?>.</strong></p>
      </div>
    <?php elseif (!$isPollActive): ?>
      <?php if (trim($pollInfo['closedHtml']) !== ''): ?>
        <?= $pollInfo['closedHtml'] ?>
      <?php else: ?>
        <p>Voting is closed. Thanks to everyone who voted!</p>
      <?php endif; ?>
    <?php else: ?>
      <?= $pollInfo['introHtml'] ?>

      <?php if ($voterId === ''): ?>
        <div class="information center top-spacer_20">
          <p><strong>Please log in to vote in the Year End Poll.</strong></p>
          <a href="auth_login.php?returnTo=/yearendpoll.php" class="btn-success">Log in to Vote</a>
        </div>
      <?php else: ?>
        <div class="information center">
          Logged in as: <strong><?= htmlspecialchars($voterEmail) ?></strong>
          | <a href="auth_logout.php?returnTo=/yearendpoll.php">Log out</a>
        </div>

        <?php if ($voteError): ?>
          <div class="twelve columns top-spacer_20 center error">
            Wow, this is embarrassing...<br>It seems that you didn't pick enough, please try again.
          </div>
        <?php elseif ($voteSuccess): ?>
          <div class="twelve columns top-spacer_20 center success">Thanks!<br>Your votes have been recorded!</div>
        <?php endif; ?>

        <?php if ($contestSuccess): ?>
          <div class="twelve columns top-spacer_20 center success">Good luck and thanks for voting!</div>
        <?php elseif ($contestError === "missing_values"): ?>
          <div class="twelve columns top-spacer_20 center error">Sorry! <br> Seems like you may be missing some value(s), please try again.</div>
        <?php elseif ($contestError === "duplicate_entry"): ?>
          <div class="twelve columns top-spacer_20 center error">Sorry! <br> Our records indicate that you have already entered the contest.</div>
        <?php elseif ($contestError): ?>
          <div class="twelve columns top-spacer_20 center error">Sorry! <br> Seems like there was an error, please try again or contact the webmaster.</div>
        <?php endif; ?>

        <?php $controller->renderPollDashboard($ip, $currentPoll); ?>

        <?php if (in_array($currentPoll, $controller->getPollNames(), true) && !$controller->hasVoted($ip, $currentPoll)): ?>
          <div class="row"><div class="twelve columns">
            <?php $controller->renderPollVoteForm($currentPoll); ?>
          </div></div>
        <?php elseif ($contestSuccess): ?>
        <?php elseif ($controller->hasEnteredContest($ip)): ?>
          <div class="center top-spacer_20">Our records indicate that you have already entered the prize drawing. Good luck!</div>
        <?php elseif ($controller->canEnterContest($ip)): ?>
          <div class="row">
            <div class="three columns"></div>
            <div class="six columns">
              <h3 class="center">Enter the prize drawing</h3>
              <form action="yearendpoll.php" method="post" class="form-default">
                <?php $controller->renderContestEntryForm(); ?>
              </form>
            </div>
            <div class="three columns"></div>
          </div>
        <?php else: ?>
          <div class="center top-spacer_20">Finish the required categories to enter the prize drawing.</div>
        <?php endif; ?>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</div>

<?php require __DIR__ . '/partials/_footer.php'; ?>
