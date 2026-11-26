<?php

// This partial expects:
// - $controller: an instance of YearEndPollController
// - $pollName: the name of the current poll

$pollValues = $controller->getPollValues($pollName);
$category = ucwords(str_replace("_", " ", $pollName));
$columnNames = $controller->getColumnNames($pollName);
$maxPicks = $controller->getMaxPicks($pollName);
?>

<h2 class="center top-spacer_20">
  <?= $controller->formatPollHeader($pollName, $category) ?>
</h2>

<form action="yearendpoll.php" method="post" name="year_end_<?= htmlspecialchars($pollName) ?>" class="form-default">
  <fieldset>
    <div class="control-group">
      <div class="controls">
        <?php foreach ($pollValues as $option): ?>
          <label for="<?= $option['id'] ?>" class="half">
            <input type="checkbox" name="year_end_votes[]" id="<?= $option['id'] ?>" value="<?= $option['id'] ?>">
            <span>
              <?php 
              // Display option details (artist, title, etc.)
              for ($c = 1; $c <= count($columnNames) - 2; $c++) {
                  echo htmlspecialchars((string)$option[$columnNames[$c]], ENT_QUOTES, 'UTF-8', false);
                  if ($columnNames[$c + 1] != 'votes' && $option[$columnNames[$c + 1]] !== '') {
                      echo " - ";
                  }
              }
              ?>
            </span>
          </label>
        <?php endforeach; ?>
      </div>
      
      <div class="control-group top-spacer_20">
        <div class="controls">
          <input type="checkbox" id="song_write_in"> 
          <input type="text" disabled="disabled" class="input-xl" id="write_in_value" name="write_in_value">
          <div class="form-other">Other (please specify)</div>
        </div>
      </div>
    </div>
    
    <div class="form-actions">
      <button class="btn-info disabled" type="submit" disabled="disabled" id="vote">
        Pick up to <?= $maxPicks ?>!
      </button>
      <input type="hidden" name="poll" value="<?= htmlspecialchars($pollName) ?>">
    </div>
  </fieldset>
</form>
