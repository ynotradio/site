<?php
date_default_timezone_set('America/New_York');
session_start(); #sessions to save login state

function open_db(){
$db_name="ynot_db";
$db_user="root";
$db_pass="";
$db_hostname="localhost";

mysql_connect($db_hostname, $db_user, $db_pass);
mysql_select_db($db_name);
}

function format($text) {
  $text = "<p>" . $text . "</p>";
  $search = array("\r", "\n\n", "\n");
  $replace = array("","</p><p>", "<br/>");
  $text = str_replace($search, $replace, $text);
  return $text;
}


// BEGIN LOGIN FUNCTIONS

function validateUser($username,$password,$remember_me) {
open_db();
  if ($username && $password) {

    $query = "SELECT * FROM users WHERE username = '$username' and (password = '$password' OR password = password('$password'))";
    $result = mysql_query($query);

    if (!$result || (mysql_num_rows($result) < 1)) {
      $_SESSION["error"] = "Your login could not be validated.";
    } else {
      $info = mysql_fetch_array($result);
      $_SESSION["username"] = $info[username];
      $_SESSION["logged_in"] = "Y";

      if ($remember_me) {
        setcookie("username",$info[username],time()+60*60*24*90,"/");
        setcookie("password",$info[password],time()+60*60*24*90,"/");
        setcookie("remember_me",$remember_me,time()+60*60*24*90,"/");
      }
    }
  } else if (($username) && (!$password)) {
    $_SESSION["error"] = "Please enter your password.";
  } else {
    $_SESSION["error"] = "You must be logged in to access this page.";
  }
}

function loginPrompt($username,$remember_me,$error) {

  echo "<div id=\"login\">\n";
  echo "<form method=\"post\" action=\"$_SERVER[PHP_SELF]\">\n";
  echo "<fieldset>";
  echo "<legend> Y-Not Radio Control Panel</legend>";
  echo "<h2>Login</h2>\n\n";

  if ($error) {
    echo "<p class=\"error\">$error</p>\n\n";
    $_SESSION["error"] = "";
  }

  echo "<label>Username: </label>\n";
  echo "<input type=\"text\" name=\"username\" value=\"$username\"/></p>\n";
  echo "<label>Password: </label>\n";
  echo "<input type=\"password\" name=\"password\"/>\n";

  if ($remember_me) {
    echo "<p class=\"checkbox\">Remember Me <input type=\"checkbox\" name=\"remember_me\"  value=\"Y\" checked=\"checked\"/>\n\n";
  } else {
    echo "<p class=\"checkbox\">Remember Me <input type=\"checkbox\" name=\"remember_me\"  value=\"Y\"/>\n\n";
  }

  echo "<p class=\"submit\"><input type=\"submit\" value=\"Login\"/>\n";
  echo "</fieldset></form>\n";
  echo "</div><!--/login-->\n";

}

function loginCheck() {

            if ($_SESSION["username"]) {
                        validateUser($_SESSION["username"],$_SESSION["password"],"");
            } else if ($_COOKIE["username"]) {
                        $_SESSION["username"] = $_COOKIE["username"];
                        $_SESSION["password"] = $_COOKIE["password"];
                        validateUser($_SESSION["username"],$_SESSION["password"],"Y");
            } else {
                        validateUser($_POST["username"],$_POST["password"],$_POST["remember_me"]);
            }

}

// LOGOFF FUNCTIONS
function logoff(){

	// kill session variables
	unset($_SESSION["username"]);
	unset($_SESSION["password"]);
	unset($_SESSION["remember_me"]);

	session_destroy();
	//setcookie("username", NULL, time()-3600);
	//setcookie("password", NULL, time()-3600);
	//setcookie("remember_me", NULL, time()-3600);
}

function active_ad_count($id){
	$query = "SELECT count(*) AS total FROM ads WHERE deleted = 'n' AND end_date >= now()";
	$result = mysql_query($query);

	if (!$result) {
		echo "error: ". $query;
		die('Invalid');
		}
	$info = mysql_fetch_assoc($result);
	
	return $info['total'];
}
?>
