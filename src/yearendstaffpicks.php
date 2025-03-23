<?php

$page_file = "yearendstaffpicks.php";
$page_title = "Year End Staff Picks";

require "functions/main_fns.php";
require "functions/year_end_staff_pick_fns.php";
require "partials/_header.php";

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content" style="white-space:nowrap;">

    <div class="twelve" style="display:inline-block;">
    		<div class="twelve columns" style="max-width: 100%"><div class="center top-spacer_20 bottom-spacer_20" ><img src="https://i.imgur.com/hIpIG5R.gif" alt="YNot Year End Poll 2024" style="max-width: 100%" ></div>

        <!-- <div class="six columns"><div class="center top-spacer_20 bottom-spacer_20"><a href="https://gopuff.onelink.me/QbZT/YNotRadio"><img src="https://i.imgur.com/HYYkf7G.png" style="max-width: 100%" /></a></div> -->
        </div>
    <div class="twelve columns top-spacer_20">

        <h1><?php echo date('Y'); ?> Y-Not Staff Favorites</h1>
    </div>
<!--
    <div class="column three">
    <a href="http://LNPhilly.com">
      <img style="margin-right: 1em; margin-top: 1em; margin-bottom: 1em; max-width: 200px;" src="http://i.imgur.com/cfpO3Qu.gif" /></a>
    </div>
-->
  </div>
  <div class="twelve columns top-spacer_20">
<table width="100%" border="0" cellspacing="5">
  <tr>
    <td bgcolor="#666666"><div align="center"><strong><a href="yearendpoll.php">Go back to 2024 YEAR END POLL</a></strong></div></td>
    <!-- <td bgcolor="#CCCCCC"><div align="center"><strong><a href="pages.php?page=yearendpoll2019">YEAR END POLL RESULTS</a></strong></div></td> -->
    <!-- <td bgcolor="#CCCCCC"><div align="center"><strong><a href="yearendstaffpicks.php">Y-NOT STAFF FAVORITES</a></strong></div></td> -->
  </tr>
</table>



    </div>


					<!--	<a href='pages.php?page=top214of2014'>TOP 214 OF 2014</a> | -->
					<!--	<a href="yearendpoll.php">2015 YEAR END POLL</a>-->
					<!--	<a href='yearendstaffpicks.php'>Y-NOT STAFF FAVORITES</a> -->
			<!-- </div> -->





		<!-- <center><h3>Vote now for your favorite songs, albums, and more in <a href="yearendpoll.php">Y-Not's 2014 Year End Poll</a>!</h3></center>
	-->


    <?php show_year_end_staff_picks(); ?>
	<div><a href="yearendpoll.php" >Go Back To Year End Poll</a></div>
  </div>
</div> <!-- end of row div -->
<?php require "partials/_footer.php"; ?>

