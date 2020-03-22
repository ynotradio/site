<?php

$page_file = "madness.php";
$page_title = "Modern Rock Madness";

$madness_start_date = '2020-03-24';
if( strtotime($madness_start_date) > strtotime('now') ) {
  header('Location: /pages.php?page=modern-rock-madness');
}

require ("functions/main_fns.php");
require ("functions/mrm_fns.php");
require ("partials/_header.php");

$current_match = now_match();

$match_id = $_POST['match_id'];
$band_id = $_POST['band_id'];

/*----- CONTENT ------*/
?>

<div class="row">
  <div class="twelve columns">
	<a href="madness.php"><img src="https://i.imgur.com/atLPpKL.jpg" alt="Modern Rock Madness 2020" width="930px"></a>
    <div id="mrm_text">
      <p>Download your Modern Rock Madness <?php echo date('Y'); ?> brackets <a href="https://od.lk/s/157927988_SSgyo/MRM2020Bracket.pdf">here</a> and listen all throughout the tournament as Y-Not bands go head to head! Help your favorites advance to the next round by voting here, or if you're listening on the go, you can text your votes in to 267-293-YNOT. </p>
      <div class="social">
        <a href="https://twitter.com/share" class="twitter-share-button" data-text="Tune in now to @YNotRadio's Modern Rock Madness - 64 bands go head to head! #modernrockmadness" data-count="none" data-via="YNotRadio">Tweet</a><script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
        <div class="fb-like" data-href="http://www.ynotradio.net/madness.php?2020" data-send="true" data-width="450" data-show-faces="false"></div>
      </div>
    </div>
<?php

if ($band_id && $match_id)
  vote($match_id, $band_id, false);

show_match($current_match['id']);
display_first_row();
display_bracket();
?>

  </div>
</div>
<?php require ("partials/_footer.php"); ?>
