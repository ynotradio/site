<?php

// This partial expects:
// - $controller: an instance of YearEndPollController
// - $ip: the user's IP address

$polls = $controller->getPollNames();
$currentPoll = $_GET['poll'] ?? null;
?>

<div class="row top-spacer_20">
  <div class="three columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[0]) ?>" class="<?= $controller->getPollClass($ip, $polls[0], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[0]) ?>
    </a>
  </div>
  <div class="three columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[1]) ?>" class="<?= $controller->getPollClass($ip, $polls[1], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[1]) ?>
    </a>
  </div>
  <div class="three columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[2]) ?>" class="<?= $controller->getPollClass($ip, $polls[2], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[2]) ?>
    </a>
  </div>
  <div class="three columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[3]) ?>" class="<?= $controller->getPollClass($ip, $polls[3], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[3]) ?>
    </a>
  </div>
</div>

<div class="row">
  <div class="four columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[4]) ?>" class="<?= $controller->getPollClass($ip, $polls[4], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[4]) ?>
    </a>
  </div>
  <div class="four columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[5]) ?>" class="<?= $controller->getPollClass($ip, $polls[5], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[5]) ?>
    </a>
  </div>
  <div class="four columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[6]) ?>" class="<?= $controller->getPollClass($ip, $polls[6], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[6]) ?>
    </a>
  </div>
</div>

<div class="row">
  <div class="four columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[9]) ?>" class="<?= $controller->getPollClass($ip, $polls[9], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[9]) ?>
    </a>
  </div>
  <div class="four columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[10]) ?>" class="<?= $controller->getPollClass($ip, $polls[10], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[10]) ?>
    </a>
  </div>
  <div class="four columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[11]) ?>" class="<?= $controller->getPollClass($ip, $polls[11], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[11]) ?>
    </a>
  </div>
</div>

<div class="row">
  <div class="six columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[7]) ?>" class="<?= $controller->getPollClass($ip, $polls[7], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[7]) ?>
    </a>
  </div>
  <div class="six columns center">
    <a href="<?= $controller->createPollLink($ip, $polls[8]) ?>" class="<?= $controller->getPollClass($ip, $polls[8], $currentPoll) ?>">
      <?= $controller->formatPollName($polls[8]) ?>
    </a>
  </div>
</div>
