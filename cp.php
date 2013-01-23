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
      <table class="table no-header table-center">
        <tr>
          <td width="225px">
            <dt><strong>-- Ads --</strong></dt>
            <dd><a href="addad.php">Add an Ad</a></dd>
            <dd><a href="ad_image_uploader.php">Upload an Ad Image</a></dd>
            <dd><a href="viewallactiveads.php">View all Active Ads (<?php echo active_ad_count() ?>)</a></dd>
            <dt><strong>-- CD of The Week --</strong></dt>
            <dd><a href="addcdotw.php">Add CD Of The Week</a><dd>
            <dd><a href="viewallcdotw.php">View all CD Of The Weeks</a><dd>
            <dt><strong>-- Concerts --</strong></dt>
            <dd><a href="addconcert.php">Add a Concert</a><dd>
            <dd><a href="viewallconcerts.php">View all Concerts</a><dd>	
            <dt><strong>-- Custom Text Pages --</strong></dt>
            <dd><a href="viewdonate.php">View Donate Text</a><dd>
            <dd><a href="viewrecordstoreday.php">View Record Store Day Text</a><dd>
            <dd><a href="viewcontests.php">View Contests Text</a><dd>
            <dt><strong>-- Deejays --</strong></dt>
            <dd><a href="adddeejay.php">Add a Deejay</a><dd>
            <dd><a href="viewalldeejays.php">View all Deejays</a><dd>
            <dt><strong>-- Images --</strong></dt>
            <dd><a href="image_uploader.php">Upload an Image</a><dd>
            <dd><a href="viewallimages.php">View all Images</a><dd>			
            <dt><strong>-- Modern Rock Madness --</strong></dt>
            <dd><a href="addmrmband.php">Add A Band</a><dd>
            <dd><a href="viewallmrmbands.php">View all Bands</a><dd>
            <dd><a href="viewallmrmmatches.php">Manage Matches</a><dd>
          </td>
          <td>
            <dt><strong>-- Music --</strong></dt>
            <dd><a href="addmusic.php">Add Music</a><dd>
            <dd><a href="viewallmusic.php">View all Music</a><dd>		
            <dt><strong>-- On Demand --</strong></dt>
            <dd><a href="addondemand.php">Add an On Demand entry</a><dd>
            <dd><a href="viewallondemands.php">View all On Demands</a><dd>
            <dt><strong>-- Schedule --</strong></dt>
            <dd><a href="addschedule.php">Add to Schedule</a><dd>
            <dd><a href="viewschedule.php">View Schedule</a><dd>
            <dt><strong>-- Stories --</strong></dt>
            <dd><a href="addstory.php">Add a Story</a></dd>
            <dd><a href="viewallstories.php">View all Stories</a></dd>
            <dd><a href="orderstories.php">Order Stories</a></dd>	
            <dt><strong>-- Top 11 @ 11 --</strong></dt>
            <dd><a href="edittop11.php">Edit Top 11 @ 11</a><dd>
            <dd><a href="edittop11message.php">Edit Top 11 @ 11 Message</a><dd>
            <dd><a href="addtop11song.php">Add Top 11 @ 11 Songs</a><dd>
            <dd><a href="viewalltop11songs.php">View all Top 11 @ 11 Songs</a><dd>
            <dd><a href="top11operations.php">Top 11 @ 11 Operations</a><dd>
            <dd><a href="addtop11vote.php">Add Top 11 @ 11 Vote</a><dd>			
            <dt><strong>-- Year End Picks & Polls --</strong></dt>
            <dd><a href="addyearendstaff.php">Add Year End Staff Pick</a><dd>
            <dd><a href="viewallyearendstaff.php">View all Year End Staff Picks</a><dd>
            <dd><a href="viewallyearendpollresults.php">View all Year End Polls</a></dd>
            <dd><a href="viewallyearendcontestants.php">View all Year End Contestants</a></dd>
         </td>
      </tr>
    </table>
    <a href="logoff.php">Exit the control panel</a>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php"); 
?>
