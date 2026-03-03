<?php

// Allow E2E tests to force the poll open via environment variable
$forcePollOpen = getenv('FORCE_YEAR_END_POLL_OPEN') === 'true';

if (!$forcePollOpen) {
    header("Location: pages.php?page=top225of2025");
    exit;
}

$page_file = "yearendpoll.php";
$page_title = "Year End Poll";
$poll_end_datetime = $forcePollOpen
    ? strtotime("+1 year")
    : strtotime("12/23/25 11:59pm EST");

require_once "functions/main_fns.php";
require_once "controllers/YearEndPollController.php";

// Initialize the controller
$db = open_db();
$controller = new \YNotRadio\Controllers\YearEndPollController($db);

// Get user IP
$ip = $_SERVER['REMOTE_ADDR'];

// Get current poll from URL
$currentPoll = $_GET['poll'] ?? null;

// Process votes if submitted
$voteSuccess = false;
$contestSuccess = false;
$contestError = false;

// Handle vote submission
if (isset($_POST['year_end_votes']) && isset($_POST['poll'])) {
    $votes = $_POST['year_end_votes'];
    $pollName = $_POST['poll'];
    $writeInValue = $_POST['write_in_value'] ?? '';

    // Validate vote count
    $voteCount = (!empty($writeInValue)) ? count($votes) + 1 : count($votes);

    if ($voteCount == $controller->getMaxPicks($pollName)) {
        // Check if user already voted
        if (!$controller->hasVoted($ip, $pollName)) {
            // Process the votes
            $voteSuccess = $controller->processVotes($pollName, $votes, $ip, $writeInValue);
        }
    } else {
        $voteError = true;
    }
}

// Handle contest entry
if (isset($_POST['contest_form'])) {
    $contestantData = [
        'name' => $_POST['name'] ?? '',
        'email' => $_POST['email'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'hometown' => $_POST['hometown'] ?? '',
        'contest' => $_POST['contest'] ?? '',
        'newsletter' => $_POST['newsletter'] ?? ''
    ];

    // Validate all fields are present
    $allFieldsPresent = !empty($contestantData['name']) &&
        !empty($contestantData['email']) &&
        !empty($contestantData['phone']) &&
        !empty($contestantData['hometown']) &&
        !empty($contestantData['contest']) &&
        !empty($contestantData['newsletter']);

    if ($allFieldsPresent) {
        // Check for duplicate entries by IP, email, and phone
        if (
            $controller->hasEnteredContest($ip) ||
            $controller->hasEnteredContestByEmail($contestantData['email']) ||
            $controller->hasEnteredContestByPhone($contestantData['phone'])
        ) {
            $contestError = "duplicate_entry";
        } else {
            $contestSuccess = $controller->processContestEntry($contestantData, $ip);
        }
    } else {
        $contestError = "missing_values";
    }
}

// Include header
require "partials/_header.php";

// Determine if poll is still running
$isPollActive = (time() <= $poll_end_datetime);

/*----- CONTENT ------*/
?>

<div class="row">
    <div class="twelve columns">
        <?php if ($isPollActive): ?>
            <div class="twelve columns">
                <div class="center top-spacer_20 bottom-spacer_20" style="max-width: 100%">
                    <img src="https://i.imgur.com/U7gvgiH.gif" alt="YNot Year End Poll 2025" style="max-width: 100%">
                </div>
            </div>

            <div class="row">
                <div class="column twelve">
                    <p>As the year winds down, it's time to pick all of your favorite music, movies, TV, and more from 2025! Cast your votes and you could win a pair of Apple AirPods Max headphones and the chance to play your own top 20 songs of the year on Y-Not Radio!
                        <br><br>
                        <!-- Vote now thru Dec. 23rd. Then we'll count down <i>The Top 225 of 2025</i> from December 29th thru January 2nd! You can sponsor a 10 song block of the countdown by making a $25 donation <a href="https://www.paypal.com/paypalme/ynotradio/25" target=_blank>here</a>. -->
                        Vote now thru Dec. 23rd. Then we'll count down <i>The Top 225 of 2025</i> from December 29th thru January 2nd!

                        <br><br>
                        <i>Need some ideas? Check out the Y-Not DJs best-of lists <a href="yearendstaffpicks.php">here</a>.</i>
                    </p>
                </div>
            </div>

            <div class="center social">
                <a href="https://twitter.com/share" class="twitter-share-button" data-text="Check out @YNotRadio's 2025 Year End Poll #YNotYearEndPoll" data-count="none" data-via="YNotRadio">Tweet</a>
                <script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
                <div class="fb-like" data-href="http://www.ynotradio.net/yearendpoll.php?2025" data-send="true" data-width="450" data-show-faces="false"></div>
            </div>

            <?php if (isset($voteError)): ?>
                <div class="row" id="flash">
                    <div class="twelve columns top-spacer_20 center error">
                        Wow, this is embarrassing...<br>It seems that you didn't pick enough, please try again.
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($voteSuccess): ?>
                <div class="row" id="flash">
                    <div class="twelve columns top-spacer_20 center success">
                        Thanks!<br>Your votes have been recorded!
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($contestSuccess): ?>
                <div class="row">
                    <div class="twelve columns top-spacer_20 center success">
                        Good luck and thanks for voting in Y-Not's 2025 Year End Poll!<br>
                        Find out all the results when we countdown The Top 225 Songs of 2025, <br>
                        December 29<sup>th</sup> thru January 2<sup>nd</sup>.
                    </div>
                </div>
            <?php elseif ($contestError === "missing_values"): ?>
                <div class="row">
                    <div class="twelve columns top-spacer_20 center error">
                        Sorry! <br> Seems like you may be missing some value(s), please try again.
                    </div>
                </div>
            <?php elseif ($contestError === "duplicate_entry"): ?>
                <div class="row">
                    <div class="twelve columns top-spacer_20 center error">
                        Sorry! <br> Our records indicate that you have already entered the contest.
                    </div>
                </div>
            <?php elseif ($contestError): ?>
                <div class="row">
                    <div class="twelve columns top-spacer_20 center error">
                        Sorry! <br> Seems like there was an error, please try again or contact the webmaster.
                    </div>
                </div>
            <?php endif; ?>

            <?php
            // Render the poll dashboard
            $controller->renderPollDashboard($ip, $currentPoll);

            // If a specific poll is selected, show the voting form
            if (in_array($currentPoll, $controller->getPollNames())) {
                echo "</div>";
                echo "<div class=\"row\">\n<div class=\"twelve columns\">";
                $controller->renderPollVoteForm($currentPoll);
                echo "</div>";
            } else {
                // If no specific poll selected, check if user can enter contest
                echo "</div>";

                if ($contestSuccess) {
                    // Already shown success message
                } elseif ($controller->hasEnteredContest($ip)) {
                    echo "<div class=\"center top-spacer_20\">Our records indicate that you have already entered to win the <b>Apple AirPods Max</b>.<br>Good Luck!</div>";
                } elseif ($controller->canEnterContest($ip)) {
                    // Show contest entry form
            ?>
                    <div class="row">
                        <div class="three columns"></div>
                        <div class="six columns">
                            <h3 class="center">Enter To Win an Apple AirPods Max.</h3>
                            <form action="yearendpoll.php" method="post" class="form-default">
                                <?php $controller->renderContestEntryForm(); ?>
                            </form>
                        </div>
                        <div class="three columns"></div>
                    </div>
            <?php
                } else {
                    echo "<div class=\"center top-spacer_20\">After you fill out the first two rows of polls, you may enter to win the <b>Apple AirPods Max</b>.</div>";
                }
            }
        else:
            // Poll has ended
            ?>
            <div class="center top-spacer_20 bottom-spacer_20">
                <img src="https://i.imgur.com/U7gvgiH.gif" alt="YNot Year End Poll 2025" style="max-width: 100%">
            </div>
            <p>Thanks to everyone who voted in Y-Not's 2025 Year End Poll! Voting is now closed and we'll be tabulating over the holiday. Tune in from December 29th - January 2nd to hear all the results in Y-Not's Top 225 of 2025 countdown, starting at 10am each day. In the meantime, check out the Y-Not DJs' <a href="yearendstaffpicks.php">top albums and songs</a>!</p>
    </div>
    <div class="center">
    </div>
<?php endif; ?>
</div>

<?php
require "partials/_footer.php";
?>
