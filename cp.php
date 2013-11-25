<?php

$page_file = "cp.php";
$page_title = "Control Panel";

require ("functions/main_fns.php");
require ("partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Control Panel</h1>
      <table class="table no-header table-center" id="control_panel">
        <tr>
          <td width="275px">
            <dt>Ads</dt>
              <dd><a href="ad_add.php">Add an Ad</a></dd>
              <dd><a href="ad_image_uploader.php">Upload an Ad Image</a></dd>
              <dd><a href="ad_view_all_active.php">View all Active Ads (<?php echo active_ad_count() ?>)</a></dd>
              <dd><a href="ads_order.php">Order Ads</a></dd>
            <dt>CD of The Week</dt>
              <dd><a href="cdotw_add.php">Add CD Of The Week</a></dd>
              <dd><a href="cdotw_view_all.php">View all CD Of The Weeks</a></dd>
            <dt>Concerts</dt>
              <dd><a href="concert_add.php">Add a Concert</a></dd>
              <dd><a href="concert_view_all.php">View all Concerts</a></dd>
            <dt>Custom Text Pages</dt>
              <dd><a href="custom_text_add.php">Add Custom Text</a></dd>
              <dd><a href="custom_text_view_all.php">View all Custom Text</a></dd>
            <dt>Deejays</dt>
              <dd><a href="deejay_add.php">Add a Deejay</a></dd>
              <dd><a href="deejay_view_all.php">View all Deejays</a></dd>
            <dt>Images</dt>
              <dd><a href="image_add.php">Upload an Image</a></dd>
              <dd><a href="image_view_all.php">View all Images</a></dd>
          </td>
          <td width="275px">
            <dt>Modern Rock Madness</dt>
              <dd><a href="mrm_add_band.php">Add A Band</a></dd>
              <dd><a href="mrm_view_all.php">View all Bands</a></dd>
              <dd><a href="mrm_manage_matches.php">Manage Matches</a></dd>
            <dt>New Music</dt>
              <dd><a href="music_add.php">Add New Music</a></dd>
              <dd><a href="music_view_all.php">View all New Music</a></dd>
            <dt>On Demand</dt>
              <dd><a href="ondemand_add.php">Add an On Demand entry</a></dd>
              <dd><a href="ondemand_view_all.php">View all On Demands</a></dd>
            <dt>Schedule</dt>
              <dd><a href="schedule_add.php">Add to Schedule</a></dd>
              <dd><a href="schedule_view_all.php">View Schedule</a></dd>
            <dt>Stories</dt>
              <dd><a href="story_add.php">Add a Story</a></dd>
              <dd><a href="story_view_all.php">View all Stories</a></dd>
              <dd><a href="stories_order.php">Order Stories</a></dd>
          </td>
          <td width="275px">
            <dt>Top 11 @ 11</dt>
              <dd><a href="top11_update.php">Update Top 11 @ 11</a></dd>
              <dd><a href="top11_update_message.php">Update Top 11 @ 11 Message</a></dd>
              <dd><a href="top11_song_add.php">Add Top 11 @ 11 Songs</a></dd>
              <dd><a href="top11_song_view_all.php">View all Top 11 @ 11 Songs</a></dd>
              <dd><a href="top11_operations.php">Top 11 @ 11 Operations</a></dd>
              <dd><a href="top11_vote_add.php">Add Top 11 @ 11 Vote</a></dd>
            <dt>Year End Picks & Polls</dt>
              <dd><a href="year_end_staff_picks_add.php">Add Year End Staff Pick</a></dd>
              <dd><a href="year_end_staff_picks_view_all">View all Year End Staff Picks</a></dd>
              <dd><a href="year_end_poll_view_all.php">View all Year End Polls</a></dd>
              <dd><a href="year_end_poll_contestants.php">View all Year End Contestants</a></dd>
         </td>
      </tr>
    </table>
    <a href="logoff.php">Exit the Control Panel</a>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
