<?php

$page_file = "ondemand.php";
$page_title = "On Demand";
$page_default_link_target = "_blank";

require ("functions/main_fns.php");
require ("models/OnDemandFactory.php");
require ("partials/_ondemand_display_helpers.php");
require ("partials/_header.php");

$db = open_db();
$onDemandModel = \YNotRadio\Models\OnDemandFactory::create($db);

$sort = "date";
	if (isset($_GET['sort']) && $_GET['sort'] != '') {
		$sort = $_GET['sort'];
	}
$id = "";
  if (isset($_GET['id']) && $_GET['id'] != '') {
  	$id = $_GET['id'];
  }
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>On Demand</h1>
    <?php
      if ($id == "") {
        echo '<div class="center">Sort: [ <a href="ondemand.php?sort=date">Newest</a> | <a href="ondemand.php?sort=artist">Artist</a> | <a href="ondemand.php?sort=text">List</a> | <a href="http://www.youtube.com/ynotradio" target="_new">Videos</a> | <a href="shows.php">Specialty Shows</a>  ] </div>';
        
        // Get sorting parameters
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = 5;
        $adjacents = 3;
        
        // Get the total number of entries
        $total_pages = $onDemandModel->getTotalCount();
        
        // Set target page for pagination
        if ($sort == "date") {
            $targetpage = "ondemand.php?sort=date";
        } else if ($sort == "artist") {
            $targetpage = "ondemand.php?sort=artist";
        } else {
            $targetpage = "ondemand.php?sort=text";
        }
        
        // Calculate pagination
        if ($page == 0) $page = 1;                  // If no page var is given, default to 1
        $lastpage = ceil($total_pages/$limit);      // Last page is total pages / items per page, rounded up
        $lpm1 = $lastpage - 1;                      // Last page minus 1
        
        // Get entries for the current page
        $entries = $onDemandModel->getAll($sort, $page, $limit);
        
        if ($sort != "text") {
            echo '<table class="ondemand">';
            foreach ($entries as $entry) {
                on_demand_player($entry['id']);
            }
            echo '</table>';
            
            echo paginate($lastpage, $targetpage, $adjacents, $page, $lpm1);
        } else {
            echo '<table class="ondemand">';
            foreach ($entries as $entry) {
                echo "<tr>\n<td>\n<a href=\"ondemand.php?id=". $entry['id']. "\">". $entry['headline'] ."\n( ". $entry['fdate']." )</a></td>\n</tr>\n";
            }
            echo '</table>';
        }
      } else {
        echo '<table class="ondemand">';
        on_demand_player($id);
        echo '</table>';
        echo '<a href="ondemand.php?sort=text"><< Back to list</a>';
      }
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
