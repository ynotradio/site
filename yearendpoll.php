<?php

$page_file = "yearendpoll.php";
$page_title = "Year End Poll";

require ("functions/main_fns.php");
require ("functions/year_end_poll_fns.php");
require ("partials/_header.php");

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

    if ($poll_form == 'songs')
      add_song_votes_for($ip, $votes, $_POST['write_in_value']);

    if ($_POST['write_in_value'])
      $insert = add_manual_vote_for($ip, $poll_form, $_POST['write_in_value']);

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

  if (!$name || !$email || !$phone || !$hometown || !$contest || !$newsletter)
    $new_contestant = 'missing_values';
  else
    $new_contestant = add_contestant($name, $email, $phone, $hometown, $contest, $newsletter, $ip);

  echo "<div class=\"row\">";
  if ($new_contestant == 1)
    echo "<div class=\"twelve columns top-spacer_20 center success\">Good luck and thanks for voting in Y-Not's 2013 Year End Poll!<br>Find out all the results when we countdown The Top 213 Songs of 2013.<br>December 30<sup>th</sup> -  January <sup>2nd</sup></div>";
  elseif($new_contestant == "missing_values") {
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
    <div class="center top-spacer_20 bottom-spacer_20"><img src="images/yearend2013_banner.jpg" alt="YNot Year End Poll 2013" width="900px"></div>
    The time has come to vote for all of your favorite stuff from 2013! Music, movies, TV, and more. Cast your vote and you could win a <b>$100 iTunes gift card</b> and the chance to play your personal top 20 songs of the year on Y-Not Radio for all to hear! Not from Philly? You can still win and host via Skype! Voting ends on Friday, December 20th at 5pm EST.<em>Then tune in to hear all the results when we count down the <b>Top 213 of 2013</b> on December 30 - 31 and January 2 - 3.</em> Check out the Y-Not DJs' <a href="yearendstaffpicks.php">top albums and songs</a>!
    <?php require ("partials/_year_end_poll_dashboard.php") ?>
    <br>
    <?php
      if (in_array($current_poll, $polls)) {
        echo "</div>";
        echo "<div class=\"row\">\n<div class=\"twelve columns\">";
        require ("partials/_year_end_poll_vote.php");
        echo "</div>";
      } else {
    ?>
</div>
<?php
  if ($new_contestant == 1) {
  } else if (has_entered_contest($ip)) {
    echo "<div class=\"center top-spacer_20\">Our records indicate that you have already entered to win the <b>$100 iTunes gift card</b>.<br>Good Luck!</div>";
  } elseif (can_enter_contest($ip)) {
?>
<div class="row">
  <div class="three columns"></div>
  <div class="six columns">
    <h3 class="center">Enter To Win A $100 iTunes Gift Card</h3>
    <form action="yearendpoll.php" method="post" class="form-default">
    <?php require ("partials/_year_end_poll_form.php"); ?>
  </div>
  <div class="three columns"></div>
</div>
<?php
  } else {
    echo "<div class=\"center top-spacer_20\">After you fill out the first two rows of polls, you may enter to win the <b>$100 iTunes gift card</b>.</div>";
  }
} //end of else
  echo "</div>";
  require ("partials/_footer.php");
?>
