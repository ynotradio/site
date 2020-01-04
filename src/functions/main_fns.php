<?php
date_default_timezone_set('America/New_York');
session_start(); #sessions to save login state

function open_db(){
  $db_name="";
  $db_user="";
  $db_pass="";
  $db_hostname="localhost";

  $db = mysqli_connect($db_hostname, $db_user, $db_pass);
  mysqli_select_db($db, $db_name);
  return $db;
}

function format($text) {
  $text = "<p>" . $text . "</p>";
  $search = array("\r", "\n\n", "\n");
  $replace = array("","</p><p>", "<br/>");
  $text = str_replace($search, $replace, $text);
  return $text;
}

function validate_user($username,$password,$remember_me) {
  $current_page = substr($_SERVER["SCRIPT_NAME"],strrpos($_SERVER["SCRIPT_NAME"],"/")+1);
  open_db();

    //Need to sanitize the input
    $username = mysql_real_escape_string($username);
    $password = mysql_real_escape_string($password);

    if ($username && $password) {

    $query = "SELECT * FROM users WHERE username = '$username' and (password = '$password' OR password = password('$password'))";
    $result = mysql_query($query);

    if (!$result || (mysql_num_rows($result) < 1)) {
      $_SESSION["error"] = "Your login could not be validated";
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
    $_SESSION["error"] = "Please enter your password";
  } else if ($current_page != 'cp' && $current_page != 'cp.php'){
    $_SESSION["error"] = "You must be logged in to access this page";
  }
}

function login_prompt($username,$remember_me,$error) {

  echo "<form method=\"post\" action=\"$_SERVER[PHP_SELF]\" class=\"form-internal inline\" id=\"login\">\n";
  echo "<fieldset>\n";
  echo "<legend> Y-Not Radio Control Panel Login</legend>\n";
  echo "<div class=\"control-group\">";
  echo "<label class=\"required\">Username</label>\n";
  echo "<div class=\"controls\"><input type=\"text\" name=\"username\" value=\"$username\" class=\"input-m\" />\n</div>\n";
  echo "<label class=\"required\">Password</label>\n";
  echo "<div class=\"controls\"><input type=\"password\" name=\"password\" class=\"input-m\"/>\n</div>\n";
  echo "<span class=\"remember_me\">Remember Me</label></span>\n";

  if ($remember_me) {
    echo "<input type=\"checkbox\" name=\"remember_me\"  value=\"Y\" checked=\"checked\"/>\n";
  } else {
    echo "<input type=\"checkbox\" name=\"remember_me\"  value=\"Y\"/>\n";
  }

  echo "</div>\n";

  if ($error) {
    echo "<div class=\"center error top-spacer_20\">$error</div>\n";
    $_SESSION["error"] = "";
  }

  echo "<p class=\"center submit\"><input type=\"submit\" value=\"Login\" class=\"btn-large btn-inverse\"/>\n";
  echo "</fieldset>\n</form>\n";
}

function login_check() {

  if ($_SESSION["username"]) {
    validate_user($_SESSION["username"],$_SESSION["password"],"");
  } else if ($_COOKIE["username"]) {
    $_SESSION["username"] = $_COOKIE["username"];
    $_SESSION["password"] = $_COOKIE["password"];
    validate_user($_SESSION["username"],$_SESSION["password"],"Y");
  } else {
    validate_user($_POST["username"],$_POST["password"],$_POST["remember_me"]);
  }

}

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

function active_ad_count(){
  $query = "SELECT count(*) AS total FROM ads WHERE deleted = 'n' AND end_date >= now()";
  $result = mysql_query($query);

  if (!$result) {
    echo "error: ". $query;
    die('Invalid');
  }
  $info = mysql_fetch_assoc($result);

  return $info['total'];
}

function on_air(){
  $query = "SELECT host FROM schedule WHERE date = date(now()) AND time(now()) > start_time AND time(now()) < end_time AND deleted='n' ORDER BY start_time DESC LIMIT 1";
  $result = mysqli_query(open_db(), $query);

  $info = mysqli_fetch_assoc($result);

  $display_name = str_replace("<br>", " ", $info['host']);
  $display_name = str_replace("<i>", "", $display_name);
  $display_name = str_replace("</i>", "", $display_name);
 
  return substr($display_name, 0, 35);
}
?>
