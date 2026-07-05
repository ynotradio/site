<?php

$page_file = "index.php";
$page_title = "Control Panel";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require ("../partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
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
              <dd>Edit in <a href="<?php echo get_payload_collection_url('ads'); ?>">Payload &rarr; Ads</a></dd>
            <dt>CD of The Week</dt>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('cdoftheweek'); ?>">Payload &rarr; CD of The Week</a></dd>
            <dt>Concerts</dt>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('concerts'); ?>">Payload &rarr; Concerts</a></dd>
            <dt>Custom Text Pages</dt>
              <dd><a href="custom_text_add.php">Add Custom Text</a></dd>
              <dd><a href="custom_text_view_all.php">View all Custom Text</a></dd>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('posts'); ?>">Payload &rarr; Posts</a></dd>
            <dt>Deejays</dt>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('djs'); ?>">Payload &rarr; Deejays</a></dd>
          </td>
          <td width="275px">
            <dt>New Music</dt>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('records'); ?>">Payload &rarr; Records</a></dd>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('songs'); ?>">Payload &rarr; Songs</a></dd>
            <dt>On Demand</dt>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('ondemand'); ?>">Payload &rarr; On Demand</a></dd>
            <dt>Schedule</dt>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('shows'); ?>">Payload &rarr; Schedule</a></dd>
            <dt>Stories</dt>
              <dd>Edit in <a href="<?php echo get_payload_collection_url('posts'); ?>">Payload &rarr; Stories</a></dd>
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
              <dd><a href="year_end_staff_picks_view_all.php">View all Year End Staff Picks</a></dd>
              <dd><a href="year_end_poll_view_all.php">View all Year End Polls</a></dd>
              <dd><a href="year_end_poll_contestants.php">View all Year End Contestants</a></dd>
         </td>
      </tr>
    </table>
    <a href="../logoff.php">Exit the Control Panel</a>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
