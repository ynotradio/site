<?php
$url_to_refresh = $_SERVER['REQUEST_URI'];
header("Refresh: 30; URL=$url_to_refresh");

// Query JSON data from live365 API
$jsonData = file_get_contents('https://api.live365.com/station/a54553');
$data = json_decode($jsonData, true);

$currentTrack = $data['current-track'];
$currentTrack['altText'] = "Album art for " . $currentTrack['artist'] . " - " . $currentTrack['title'];
$lastPlayed = array_slice($data['last-played'], 0, 4);

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    html,
    body {
      background: #666;
      color: #fff;
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      font-size: 12px;
      margin: 0;
      padding: 0;
    }

    .ynot-np-container {
      display: flex;
      align-items: flex-start;
      padding: 0.75rem;
      min-height: 100%;
      box-sizing: border-box;
    }

    .ynot-np-artwork-img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .ynot-np-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      margin-left: 0.75rem;
      overflow: hidden;
    }

    .ynot-np-track {
      padding-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ynot-np-track--current {
      font-weight: bold;
    }

    .ynot-np-track-artist::after {
      content: " - ";
    }

    .ynot-np-track-title {
      font-style: italic;
    }
  </style>
</head>
<body>
  <section class="ynot-np-container">
    <div class="ynot-np-artwork">
      <img class="ynot-np-artwork-img" src="<?php echo $currentTrack['art']; ?>" alt="<?php echo $currentTrack['altText'] ?>" />
    </div>
    <ol class="ynot-np-list">
      <li class="ynot-np-track ynot-np-track--current">
        <span class="ynot-np-track-artist"><?php echo $currentTrack['artist']; ?></span>
        <span class="ynot-np-track-title"><?php echo $currentTrack['title']; ?></span>
      </li>
      <?php
      foreach ($lastPlayed as $track) {
        echo '<li class="ynot-np-track">';
        echo '<span class="ynot-np-track-artist">' . $track['artist'] . '</span>';
        echo '<span class="ynot-np-track-title">' . $track['title'] . '</span>';
        echo '</li>';
      }
      ?>
    </ol>
  </section>
</body>
</html>
