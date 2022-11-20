<?php 

$page_file = "nowextynot.php";
$page_title = "Now Playing Extension";

require ("functions/main_fns.php");

?>
<?php

if ( $_GET["artist"] <> "ID/PSA" && $_GET["title"] <> "Talk Break" && $_GET["title"] <> "N/A" ) {	
   

   if ( $_GET["title"] <> "sponsorship" )
   { 

   $update = "INSERT INTO now_playing (artist,title,album,playtime) VALUES ('".$_GET["artist"]."','".$_GET["title"]."','".$_GET["album"]."',".time().")";
   $result = mysqli_query(open_db(), $update);

    if (!$result) {
        echo "error: ". $query;
        die('Invalid');
    }

   }
}
	
?>