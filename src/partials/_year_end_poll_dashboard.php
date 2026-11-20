<?php

// This partial expects:
// - $controller: an instance of YearEndPollController
// - $ip: the voter key (IP address or Auth0 user ID)

$polls = $controller->getPollNames();
$currentPoll = $_GET['poll'] ?? null;
?>

<?php foreach (array_chunk($polls, 3) as $i => $row): ?>
<div class="row<?= $i === 0 ? ' top-spacer_20' : '' ?>">
  <?php foreach ($row as $poll): ?>
  <div class="four columns center">
    <a href="<?= htmlspecialchars($controller->createPollLink($ip, $poll)) ?>" class="<?= $controller->getPollClass($ip, $poll, $currentPoll) ?>">
      <?= htmlspecialchars($controller->formatPollName($poll)) ?>
    </a>
  </div>
  <?php endforeach; ?>
</div>
<?php endforeach; ?>
