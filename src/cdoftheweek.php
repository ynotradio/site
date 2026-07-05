<?php

$page_file = "cdoftheweek.php";
$page_title = "CD of The Week";

require ("functions/main_fns.php");
require ("partials/_header.php");
require_once ("models/CdOfTheWeekFactory.php");

$cd_id = $_GET['id'] ?? null;

function renderCdCoverImage(string $imageUrl, ?string $artistUrl, string $altText): string
{
    $safeImageUrl = htmlspecialchars($imageUrl, ENT_QUOTES);
    $safeAltText = htmlspecialchars($altText, ENT_QUOTES);
    $coverImage = '<img src="' . $safeImageUrl . '" height="200" alt="' . $safeAltText . '">';

    if (
        !empty($artistUrl)
        && filter_var($artistUrl, FILTER_VALIDATE_URL)
        && preg_match('/^https?:\/\//i', $artistUrl)
    ) {
        $safeArtistUrl = htmlspecialchars($artistUrl, ENT_QUOTES);
        $coverImage = '<a href="' . $safeArtistUrl . '" target="_blank" rel="noopener noreferrer">' . $coverImage . '</a>';
    }

    return $coverImage;
}

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns">
    <h1>CD of The Week</h1>
    <?php 
    try {
        $cdOfTheWeek = \YNotRadio\Models\CdOfTheWeekFactory::create(open_db());
        
        if ($cd_id) {
            $cd = $cdOfTheWeek->getById($cd_id);
            if ($cd) {
                $coverImage = renderCdCoverImage(
                    $cd['cd_pic_url'],
                    $cd['band'] ?? null,
                    $cd['artist'] . ' - ' . $cd['title'] . ' album cover'
                );
                echo "<h3>" . $cd['artist'] . " - <em>" . $cd['title'] . "</em> (" . $cd['label'] . ")</h3>\n" .
                     "<div class=\"review\"> " . $coverImage . "\n" .
                     $cd['review'] . "</div>\n" .
                     "<div class=\"footnote\">Review by " . $cd['reviewer'] . "</div>\n";
            }
        } else {
            $current = $cdOfTheWeek->getCurrent();
            if ($current) {
                $latestDate = $current['date'];
                $latestCds = array_values(array_filter(
                    $cdOfTheWeek->getAll(),
                    fn($cd) => $cd['date'] == $latestDate
                ));

                // Display the date once
                echo "Week of " . date('n/j/y', strtotime($latestDate));

                $lastIndex = count($latestCds) - 1;
                foreach ($latestCds as $i => $cd) {
                    $displayCd = $cdOfTheWeek->getById((int) $cd['id']) ?: $cd;
                    $coverImage = renderCdCoverImage(
                        $displayCd['cd_pic_url'],
                        $cd['band'] ?? null,
                        $cd['artist'] . ' - ' . $cd['title'] . ' album cover'
                    );
                    echo "<h3>" . $cd['artist'] . " - <em>" . $cd['title'] . "</em> (" . $cd['label'] . ")</h3>\n" .
                         "<div class=\"review\"> " . $coverImage . "\n" .
                         $cd['review'] . "</div>\n" .
                         "<div class=\"footnote\">Review by " . $cd['reviewer'] . "</div>\n";
                    if ($i < $lastIndex) {
                        echo "<hr class=\"review-separator\">\n";
                    }
                }
            }
        }
    } catch (Exception $e) {
        error_log("Error in CD of the Week implementation: " . $e->getMessage());
        echo "<p>Sorry, there was an error loading the CD of the Week. Please try again later.</p>";
    }
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<div class ="row">
  <div class="twelve columns content">
    <h2>See other reviews:</h2>
    <?php
    try {
        $allCds = $cdOfTheWeek->getAll();
        echo '<table class="table-center">';
        foreach ($allCds as $index => $cd) {
            if ($index % 8 == 0) {
                echo "<tr>\n";
            }
            echo "<td>\n<a class=\"past_review\" href=\"cdoftheweek.php?id=" . $cd['id'] . "\"> <img src=\"" . $cd['cd_pic_url'] . "\" height=\"100\" width=\"100\" ></a>\n</td>\n";
            if ($index % 8 == 7) {
                echo "</tr>\n";
            }
        }
        echo '</table>';
    } catch (Exception $e) {
        error_log("Error in CD of the Week cover art implementation: " . $e->getMessage());
        echo "<p>Sorry, there was an error loading the past reviews. Please try again later.</p>";
    }
    ?>
  </div>
</div>
<?php require ("partials/_footer.php"); ?>
