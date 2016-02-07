<?php

$page_file = "top11.php";
$page_title = "Top 11 Picks";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/top11_fns.php");
open_db();

/*----- CONTENT ------*/
?>

<div id="top11_area">
<?php

$top11picks = $_POST['top11'];
$write_in = $_POST['write_in'];

if($write_in){
	$limit = 3;
	} else {
		$limit = 4;
	}

  if(empty($top11picks))
  {
    echo("<center><h3>You didn't select any songs, please <a href='top11.php'>go back</a> and try again.</h3><center>");
  }
  elseif (count($top11picks) >=$limit)
  {
    echo("<center><h3>You selected more than 3 songs, please <a href='top11.php'>go back</a> and select only 3 songs.</h3><center>");
  }
  else
  {
    $ip = $_SERVER['REMOTE_ADDR'];
    //$ip = "129.0.0.4";
	if ($_SERVER['HTTP_REFERER'] == "http://ynotradio.net/addtop11vote.php" || $_SERVER['HTTP_REFERER'] == "http://www.ynotradio.net/addtop11vote.php" || checkip($ip) == "true") {
	    $count = count($top11picks);	
	    for($i=0; $i < $count; $i++)
	    {
	      addtop11plus1($top11picks[$i]);
	     }
	
		if (!get_magic_quotes_gpc()){
			$firstname = addslashes($_POST['firstname']);
			$lastname = addslashes($_POST['lastname']);
			$email = addslashes($_POST['email']);
			$phone = addslashes($_POST['phone']);
			$write_in = addslashes($_POST['write_in']);
		}
			$contest = $_POST['contest'];
			$newsletter = $_POST['newsletter'];
			
		if ($write_in) {
			write_in($write_in);
		}
				
		if ($contest == "yes" && ($email || $phone)) {
			addcontestant($firstname, $lastname, $email, $phone, $contest, $newsletter);
			echo "<center><h3>We have received your entry and song selections, thanks!</h3></center>";
		} else {
	    	echo "<center><h2>We have received your song entries, thanks!</h2></center>";
		}
				
		if ($contest == "no" && $newsletter == 'yes' && ($email || $phone)) {
			addcontestant($firstname, $lastname, $email, $phone, $contest, $newsletter);
		}
	  } // end if check_ip
	  else {
		echo "<center><h3>Our records show that you have already voted this week.</h3>";
		echo "If you feel this is a mistake, please contact <a href=\"mailto:josh@ynotradio.net?Subject=Top11%20Voting%20Error\">Josh T. Landow.</a></center>";
		}
} 


?>
</div>
<div id="ads">
<?php
require("ads.php");
?>
</div>
<div style="clear:both;"></div>
<?php require ("ext/footer.php"); ?>
