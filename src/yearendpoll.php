<?php

/*Redirect to be used after year end poll*/
// header("Location: pages.php?page=top220of2020");
// die();

$page_file = "yearendpoll.php";
$page_title = "Year End Poll";
$poll_end_datetime = strtotime("12/23/20 4pm");

require "functions/main_fns.php";
require "functions/year_end_poll_fns.php";
require "partials/_header.php";

$ip = $_SERVER['REMOTE_ADDR'];

$current_poll = $_GET['poll'];
$polls = get_poll_names();

$votes = $_POST['year_end_votes'];
$poll_form = $_POST['poll'];

$vote_count = ($_POST['write_in_value'] == '') ? count($votes) : count($votes) + 1;

if ($vote_count != max_picks_for($poll_form)) {
    echo "<div class=\"row\" id=\"flash\">\n
  <div class=\"twelve columns top-spacer_20 center error\">Wow, this is embarrassing...<br>It seems that you didn't pick enough, please try again.</div>\n
  \n</div>";
} else {
    if (has_voted($ip, $poll_form) == false) {
        $insert = add_votes_for($poll_form, $votes);

        if ($poll_form == 'songs') {
            add_song_votes_for($ip, $votes, $_POST['write_in_value']);
        }

        if ($_POST['write_in_value']) {
            $insert = add_manual_vote_for($ip, $poll_form, $_POST['write_in_value']);
        }

        if ($insert) {
            add_ip($ip, $poll_form);
            echo "<div class=\"row\" id=\"flash\">\n
      <div class=\"twelve columns top-spacer_20 center success\">Thanks!<br>Your votes have been recorded!</div>\n
      \n</div>";
        }
    }
}

if ($_POST['contest_form']) {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $hometown = $_POST['hometown'];
    $contest = $_POST['contest'];
    $newsletter = $_POST['newsletter'];

    if (!$name || !$email || !$phone || !$hometown || !$contest || !$newsletter) {
        $new_contestant = 'missing_values';
    } else {
        $new_contestant = add_contestant($name, $email, $phone, $hometown, $contest, $newsletter, $ip);
    }

    echo "<div class=\"row\">";
    if ($new_contestant == 1) {
        echo "<div class=\"twelve columns top-spacer_20 center success\">Good luck and thanks for voting in Y-Not's 2020 Year End Poll!<br>Find out all the results when we countdown The Top 220 Songs of 2020, <br>December 30th<sup>th</sup> thru January 3<sup>rd</sup> .</div>";
    } elseif ($new_contestant == "missing_values") {
        echo "<div class=\"twelve columns top-spacer_20 center error\">Sorry! <br> Seems like you may be missing some value(s), please try again.</div>";
    } else {
        echo "<div class=\"twelve columns top-spacer_20 center error\">Sorry! <br> Seems like there was an error, please try again or contact the webmaster.</div>";
    }
    echo "</div>";
}

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns">
    <?php if (date("Y-m-d H:i:s", time()) <= date("Y-m-d H:i:s ", $poll_end_datetime)) { ?>

        <div class="twelve columns"><div class="center top-spacer_20 bottom-spacer_20" style="max-width: 100%">
          <img src="https://i.imgur.com/QRvzAZV.png" alt="YNot Year End Poll 2020"  style="max-width: 100%">
        </div>

        <!-- <div class="six columns"><div class="center top-spacer_20 bottom-spacer_20"><img src="https://i.imgur.com/LGccI17.jpg" style="max-width: 100%" /></div> -->
        </div>

    <div class="row">

    <div class="column twelve">

    <p>2020 may be a year that we'd rather forget, but there was a lot of great music to get us through it! Now, it's time to pick your favorite song, albums, and more of this strange year! Cast your votes and you could win a <strong>$100 goPuff gift card</strong> and the chance to play your own top 20 songs of the year on Y-Not Radio!
    Vote now thru <strong>December 23rd</strong>. Then we'll count down <em>The Top 220 of 2020</em> from December 28th thru 31st!
    Need some ideas? Check out the Y-Not DJs best of lists <a href="/yearendstaffpicks.php">here</a>.</p>

      <p><em>Y-Not Radio’s 2020 Year End Poll is brought to you by <strong>goPuff.</strong>  goPuff delivers food & drinks, cleaning supplies, home needs, over-the-counter medication and more in just minutes.  24/7 in most areas and late night everywhere else to bring you what you need, when you need it most.  <a href="https://gopuff.com/" target="_blank">Download the goPuff app</a> and use code: <strong>YNOT</strong> for $5 off your first two orders!  New customers only. </em></p>
      <div class="center">
        <p><a href="https://gopuff.com/"><img src="https://i.imgur.com/gaPe8zc.jpg" alt="goPuff advertisement" /></p>
      </div>
    </div>

    </div>

  <div class="center social">
    	<a href="https://twitter.com/share" class="twitter-share-button" data-text="Check out @YNotRadio's 2020 Year End Poll #YNotYearEndPoll" data-count="none" data-via="YNotRadio">Tweet</a><script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
        <div class="fb-like" data-href="http://www.ynotradio.net/yearendpoll.php?2020" data-send="true" data-width="450" data-show-faces="false"></div>
    </div>
    <?php
require "partials/_year_end_poll_dashboard.php" ?>
        <br>
        <?php
if (in_array($current_poll, $polls)) {
    echo "</div>";
    echo "<div class=\"row\">\n<div class=\"twelve columns\">";
    require "partials/_year_end_poll_vote.php";
    echo "</div>";
} else {
    ?>
</div>
<?php
if ($new_contestant == 1) {
    } elseif (has_entered_contest($ip)) {
        echo "<div class=\"center top-spacer_20\">Our records indicate that you have already entered to win the <b>$100 goPuff gift card</b>.<br>Good Luck!</div>";
    } elseif (can_enter_contest($ip)) {
        ?>
<div class="row">
  <div class="three columns"></div>
  <div class="six columns">
    <h3 class="center">Enter To Win A $100 iTunes Gift Card</h3>
    <form action="yearendpoll.php" method="post" class="form-default">
    <?php require "partials/_year_end_poll_form.php"; ?>
  </div>
  <div class="three columns"></div>
</div>
<?php
} else {
        echo "<div class=\"center top-spacer_20\">After you fill out the first two rows of polls, you may enter to win the <b>$100 goPuff gift card</b>.</div>";
    }
} //end of else
} else {
    echo "<div class=\"center top-spacer_20 bottom-spacer_20\">
        <img src=\"https://i.imgur.com/XfpNj1L.jpg\" alt=\"YNot Year End Poll 2020\"  style=\"max-width: 100%\">
            </div>
<p>Thanks to everyone who voted in Y-Not's 2020 Year End Poll!  Voting is now closed and we'll be tabulating over the holiday. Tune in from December 30th - January 3rd to hear all the results in Y-Not’s Top 220 of 2020 countdown, starting at 10am each day. In the meantime, check out the Y-Not DJs' <a href=\"yearendstaffpicks.php\">top albums and songs</a>!</p>
          </div>
          <p><em>Y-Not's 2020 Year End Poll is sponsored by goPuff!  goPuff delivers snacks, drinks, essentials and basically all of your convenience needs right to your door, so you can just sit back and relax!  What you need, when you need it, anytime.  goPuff delivers in over 150 locations like Philadelphia, Boston, D.C., Seattle, Portland, Dallas, Chicago, and more.  <a href=\"https://gopuff.com/\">Download the goPuff app</a> and use code \"YNOTRADIO\" for $5 off your first two orders! New customers only. </em></p>
          <div class=\"center\">
          <p><a href=\"https://gopuff.com/\"><img src=\"https://i.imgur.com/MdzqySO.jpg\" alt=\"goPuff advertisement\" /></p>
          </div>";
} // end of time check
echo "</div>";
require "partials/_footer.php";
?>
