<?php

$page_file = "yearendstaffpicks.php";
$page_title = "Year End Staff Picks";

require ("functions/main_fns.php");
require ("functions/year_end_staff_pick_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content" style="white-space:nowrap;">
    
    <div class="twelve" style="display:inline-block;">
    <div class="nine columns top-spacer_20">
    		<img src="images/2015YearEndSponsoredBanner.png" style="margin-bottom:18px;" alt="YNot Year End Poll 2015" width="100%">
    		<!-- <div class="center top-spacer_20">-->
    		<table width="100%" style="font-size:small;" border="0" cellspacing="5">
  					<tr>
    					<td bgcolor="#CCCCCC"><div align="center"><strong><a href="pages.php?page=top215of2015">TOP 215 SONGS OF 2015</a></strong></div></td>
    					<td bgcolor="#CCCCCC"><div align="center"><strong><a href="pages.php?page=yearendpoll2015">YEAR END POLL RESULTS</a></strong></div></td>
    					<td bgcolor="#666666"><div align="center"><strong><a href="yearendstaffpicks.php">Y-NOT STAFF FAVORITES</a></strong></div></td>
  					</tr>
			</table>
    </div>
	<div class="three columns top-spacer_20">
		<!-- <a href="http://www.ticketmaster.com/venue/17012?C=DISP_CT_Philadelphia_YNotRadio_121615" target="_blank"> -->
    		<img src="images/fillmore300.gif" height="218px" alt="Fillmore">
    	<!-- </a>-->
	</div>
	</div>
					<!--	<a href='pages.php?page=top214of2014'>TOP 214 OF 2014</a> | -->
					<!--	<a href="yearendpoll.php">2015 YEAR END POLL</a>-->
					<!--	<a href='yearendstaffpicks.php'>Y-NOT STAFF FAVORITES</a> -->
			<!-- </div> -->
    


    
		
		<!-- <center><h3>Vote now for your favorite songs, albums, and more in <a href="yearendpoll.php">Y-Not's 2014 Year End Poll</a>!</h3></center>
	-->

    <h1><?php echo date('Y');?> Y-Not Staff Favorites</h1>
    <?php show_year_end_staff_picks(); ?>
	<div><a href="yearendpoll.php" >Go Back To Year End Poll</a></div>
  </div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
