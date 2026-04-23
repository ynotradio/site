<?php
require_once __DIR__ . '/_now_playing_data.php';

$url_to_refresh = $_SERVER['REQUEST_URI'];
header("Refresh: 30; URL=$url_to_refresh");

$compact = !empty($_GET['compact']);
$json = !empty($_GET['json']);
$historyLimit = $compact ? 2 : 4;

$np = ynot_get_now_playing();
$currentTrack = $np['currentTrack'];
$artist = $currentTrack['artist'] ?? '';
$title = $currentTrack['title'] ?? 'Y-Not Radio';
$lastPlayed = array_slice($np['lastPlayed'], 0, $historyLimit);

// Lightweight JSON endpoint for the mobile marquee to fetch via same-origin AJAX,
// or for any other consumer that wants the data without the iframe HTML wrapper.
if ($json) {
    $jsonHistoryLimit = isset($_GET['history']) ? max(0, min(10, (int) $_GET['history'])) : 4;
    $history = array_map(function ($t) {
        return [
            'artist' => $t['artist'] ?? '',
            'title' => $t['title'] ?? '',
        ];
    }, array_slice($np['lastPlayed'], 0, $jsonHistoryLimit));

    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: max-age=10, public');
    echo json_encode([
        'available' => $np['available'],
        'artist' => $artist,
        'title' => $title,
        'lastPlayed' => $history,
    ]);
    return;
}
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
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }

    .ynot-np-container {
      display: flex;
      align-items: stretch;
      padding: 10px 12px;
      box-sizing: border-box;
      gap: 10px;
    }

    .ynot-np-artwork {
      flex-shrink: 0;
    }

    .ynot-np-artwork-img,
    .ynot-np-artwork-placeholder {
      width: 90px;
      height: 90px;
      object-fit: cover;
      border: 1px solid rgba(0, 0, 0, 0.4);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    .ynot-np-artwork-placeholder {
      background: #444;
    }

    .ynot-np-offline {
      padding: 12px;
      font-style: italic;
      opacity: 0.75;
    }

    .ynot-np-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .ynot-np-eyebrow {
      display: block;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #cc3333;
      text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.4);
      margin-bottom: 3px;
    }

    .ynot-np-track {
      padding-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ynot-np-track--current {
      font-weight: bold;
      padding-bottom: 6px;
    }

    .ynot-np-track-artist::after {
      content: " – ";
    }

    .ynot-np-track-title {
      font-style: italic;
    }
  </style>
</head>
<body>
<?php if (!$np['available']): ?>
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
        <span class="ynot-np-eyebrow">Now Playing</span>
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
