<?php

$visitor = $_POST['visitor'];
$visitormail = $_POST['visitormail'];
$notes = $_POST['notes'];
$attention = $_POST['attention'];

$validation_one = valid_email($visitormail);
$validation_two = missing_data($visitor, $visitormail, $notes);
$validation_three = missing_attention($attention);

if (!empty($validation_three))
  $error_message = $validation_three;
if (!empty($validation_two))
  $error_message = $validation_two;
if (!empty($validation_one))
  $error_message = $validation_one;

if (empty($validation_one) && empty($validation_two) && empty($validation_three)) {
  $today_is = date("l, F j, Y, g:i a") ;
  $notes = stripcslashes($notes);

  $attention_values = get_attention($attention);
  $subject = "To ". $attention_values[1]. " from ynotradio.net";
  $message = build_message($today_is, $attention_values, $notes, $visitor, $visitormail);
  $from = "From: $visitormail\r\n";

  send_mail($attention_values[0], $subject, $message, $from);

  echo "<div class=\"success center\">
    <h2>". ucfirst($visitor) .", thanks for your message!</h2>
    </div>";

  } else {
    echo "<div class=\"center error\">". $error_message ."</div>";
  }

function valid_email($visitormail) {
  if(!empty($visitormail) && (!strstr($visitormail,"@") || !strstr($visitormail,".")))
    return "Use the back button and enter a valid e-mail address.\n<br>\nYour feedback was not submitted.\n";
}

function missing_data($visitor, $visitormail, $notes) {
  if (empty($visitor) || empty($visitormail) || empty($notes ) )
    return "Sorry. You are missing a required field.\n<br>\nHit the back button and fill in all fields.\n";
}

function missing_attention($attention) {
  if(empty($attention))
    return "Use the back button and select a department.\n";
}

function get_attention($attention) {
  $return_values = array();

  if ($attention=="1") {
    array_push($return_values, "josh@ynotradio.net");
    array_push($return_values, "Josh (Programming)");
    array_push($return_values, false);
  }
  if ($attention=="2") {
    array_push($return_values, "local@ynotradio.net");
    array_push($return_values, "Local Music Director");
    array_push($return_values, false);
  }
  if ($attention=="3") {
    array_push($return_values, "josh@ynotradio.net");
    array_push($return_values, "Josh (Advertising/Sponsorships)");
    array_push($return_values, false);

  }
  if ($attention=="4") {
    array_push($return_values, "webmaster@ynotradio.net");
    array_push($return_values, "Webmaster");
    array_push($return_values, true);
  }

  return $return_values;
}

function build_message($today_is, $attention_values, $notes, $visitor, $visitormail) {
$message = " $today_is [EST] \n
  Attention: $attention_values[1] \n
  Message: $notes \n
  From: $visitor ($visitormail)\n";
  if ($attention_values[2]){
    $ip = $_POST['ip'];
    $httpref = $_POST['httpref'];
    $httpagent = $_POST['httpagent'];

    $message = $message. "Additional Info : IP = $ip \n
    Browser Info: $httpagent \n
    Referral : $httpref \n";
  };

  return $message;
}

function send_mail($to, $subject, $message, $from) {
  mail($to, $subject, $message, $from);
}
?>
