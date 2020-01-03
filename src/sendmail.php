<?php

$page_file = "contact.php";
$page_title = "Contact Us - Send Us E-mail";

require ("ext/main_fns.php");
require ("ext/header.php");

/*-------- CONTENT ---------*/

$ip = $_POST['ip'];
$httpref = $_POST['httpref'];
$httpagent = $_POST['httpagent'];
$visitor = $_POST['visitor'];
$visitormail = $_POST['visitormail'];
$notes = $_POST['notes'];
$attn = $_POST['attn'];
?>
<div style="padding: 2em;">

<?php

if(!$visitormail == "" && (!strstr($visitormail,"@") || !strstr($visitormail,".")))
{
echo "<center><h3>Use Back Button & Enter a valid e-mail</h3></center>\n";
$badinput = "<center><h3>Feedback was NOT submitted</h3></center>\n";
echo $badinput;
echo "</div>";
require("ext/footer.php");
die;
}

if(empty($visitor) || empty($visitormail) || empty($notes )) {
echo "<h3><center>Sorry. You are missing something.
<br>Hit the Back Button and fill in all fields</center></h3>\n";
echo "</div>";
require("ext/footer.php");
die;
}

$todayis = date("l, F j, Y, g:i a") ;

if(empty($attn)){
echo "<h2>Use Back Button- Missing Department</h2>\n";
echo "</div>";
require("ext/footer.php");
die;
}

if ($attn=="1"){
	$to = "josh@ynotradio.net";
    $attn ="Josh (Programming)";
    $extrainfo = 0;
}
if ($attn=="2"){
	$to = "local@ynotradio.net";
    $attn ="Local Music Director";
    $extrainfo = 0;
}
if ($attn=="3"){
	$to = "josh@ynotradio.net";
    $attn ="Josh (Advertising/Sponsorships)";
    $extrainfo = 0;
}
if ($attn=="4"){
	$to = "webmaster@ynotradio.net";
    $attn ="Webmaster";
    $extrainfo = 1;
}


$subject = "To ". $attn. " from ynotradio.net";

$notes = stripcslashes($notes);

$message = " $todayis [EST] \n
Attention: $attn \n
Message: $notes \n
From: $visitor ($visitormail)\n";
if ($extrainfo == 1){
$message = $message. "Additional Info : IP = $ip \n
Browser Info: $httpagent \n
Referral : $httpref \n";
}

$from = "From: $visitormail\r\n";

mail($to, $subject, $message, $from);

?>

<p align="center">
Thanks for your message!
<br>
<b>Date: </b><?php echo $todayis ?>
<br />
<b>Thank You: </b><?php echo $visitor ?> ( <?php echo $visitormail ?> )
<br />
<b>Attention: </b><?php echo $attn?>
<br />
<b>Message: </b><?php $notesout = str_replace("\r", "<br/>", $notes);
echo $notesout; ?>

</p>
</div>
<?php
/*----- END OF CONTENT ------*/

require("ext/footer.php");

?>