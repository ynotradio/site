<?php
$url_to_refresh = $_SERVER['REQUEST_URI'];
header("Refresh: 30; URL=$url_to_refresh");

// Query JSON data from live365 API; @ suppresses SSL/network errors in dev environments
$jsonData = @file_get_contents('https://api.live365.com/station/a54553');
$data = ($jsonData !== false) ? json_decode($jsonData, true) : null;

$currentTrack = $data['current-track'] ?? ['artist' => '', 'title' => 'Y-Not Radio', 'art' => ''];
$artist = $currentTrack['artist'] ?? '';
$title = $currentTrack['title'] ?? 'Y-Not Radio';
$currentTrack['altText'] = $artist ? "Album art for $artist - $title" : 'Y-Not Radio';
$lastPlayed = isset($data['last-played']) ? array_slice($data['last-played'], 0, 4) : [];

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

    .ynot-np-artwork-placeholder {
      width: 80px;
      height: 80px;
      background: #444;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ynot-np-offline {
      padding: 0.75rem;
      font-style: italic;
      opacity: 0.75;
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
<?php if ($data === null): ?>
  <p class="ynot-np-offline">Nothing playing right now.</p>
<?php else: ?>
  <section class="ynot-np-container">
    <div class="ynot-np-artwork">
      <?php if (!empty($currentTrack['art'])): ?>
        <img class="ynot-np-artwork-img" src="<?php echo htmlspecialchars($currentTrack['art']); ?>" alt="<?php echo htmlspecialchars($currentTrack['altText']); ?>"/>
      <?php else: ?>
        <div class="ynot-np-artwork-placeholder"></div>
      <?php endif; ?>
    </div>
    <ol class="ynot-np-list">
      <li class="ynot-np-track ynot-np-track--current">
        <span class="ynot-np-track-artist"><?php echo htmlspecialchars($artist); ?></span>
        <span class="ynot-np-track-title"><?php echo htmlspecialchars($title); ?></span>
      </li>
      <?php foreach ($lastPlayed as $track): ?>
        <li class="ynot-np-track">
          <span class="ynot-np-track-artist"><?php echo htmlspecialchars($track['artist'] ?? ''); ?></span>
          <span class="ynot-np-track-title"><?php echo htmlspecialchars($track['title'] ?? ''); ?></span>
        </li>
      <?php endforeach; ?>
    </ol>
  </section>
<?php endif; ?>
</body>
</html>
