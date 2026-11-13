<?php

// Year End Poll page when use_postgres_yearendpoll is on. Categories, copy and
// the voting window come from the Payload poll; voters log in with Auth0.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$page_file = "yearendpoll.php";
$page_title = "Year End Poll";

require_once __DIR__ . '/../vendor/autoload.php';

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

require_once __DIR__ . '/../functions/main_fns.php';
require_once __DIR__ . '/../controllers/YearEndPollController.php';

$controller = new \YNotRadio\Controllers\YearEndPollController();
$pollInfo = $controller->getPollInfo();

if ($pollInfo === null) {
    header("Location: index.php");
    exit;
}

$now = time();
$opensAt = $pollInfo['opensAt'] ? strtotime($pollInfo['opensAt']) : null;
$closesAt = $pollInfo['closesAt'] ? strtotime($pollInfo['closesAt']) : null;
$isPollActive = ($opensAt === null || $now >= $opensAt) && ($closesAt === null || $now <= $closesAt);

// Templates below take the voter key as $ip.
$ip = $voterId;
$currentPoll = $_GET['poll'] ?? null;
$voteSuccess = false;
$voteError = false;
$contestSuccess = false;
$contestError = false;

if ($isPollActive && $voterId !== '' && isset($_POST['poll'])) {
    $pollName = $_POST['poll'];
    $votes = $_POST['year_end_votes'] ?? [];
    $writeInValue = trim($_POST['write_in_value'] ?? '');
    $voteCount = count($votes) + ($writeInValue !== '' ? 1 : 0);

    if (!in_array($pollName, $controller->getPollNames(), true)
        || $voteCount !== $controller->getMaxPicks($pollName)) {
        $voteError = true;
    } elseif (!$controller->hasVoted($ip, $pollName)) {
        $voteSuccess = $controller->processVotes($pollName, $votes, $ip, $writeInValue);
    }
}

if ($isPollActive && $voterId !== '' && isset($_POST['contest_form'])) {
    $contestantData = [
        'name' => $_POST['name'] ?? '',
        'email' => $voterEmail !== '' ? $voterEmail : ($_POST['email'] ?? ''),
        'phone' => $_POST['phone'] ?? '',
        'hometown' => $_POST['hometown'] ?? '',
        'contest' => $_POST['contest'] ?? '',
        'newsletter' => $_POST['newsletter'] ?? '',
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

require __DIR__ . '/_header.php';
?>

<div class="row">
  <div class="twelve columns">
    <h1><?= htmlspecialchars($pollInfo['name']) ?></h1>

    <?php if (!$isPollActive): ?>
      <?= $pollInfo['closedHtml'] ?>
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

<?php require __DIR__ . '/_footer.php'; ?>
