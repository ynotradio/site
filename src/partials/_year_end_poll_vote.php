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

<form action="yearendpoll.php" method="post" name="year_end_<?= $pollName ?>" class="form-default">
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
                  echo $option[$columnNames[$c]];
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
        Pick <?= $maxPicks ?> more!
      </button>
      <input type="hidden" name="poll" value="<?= $pollName ?>">
    </div>
  </fieldset>
</form>

<script>
  // Client-side validation and UI behavior
  document.addEventListener('DOMContentLoaded', function() {
    const maxPicks = <?= $maxPicks ?>;
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="year_end_votes[]"]');
    const writeInCheckbox = document.getElementById('song_write_in');
    const writeInField = document.getElementById('write_in_value');
    const voteButton = document.getElementById('vote');
    
    // Track selected count
    let selectedCount = 0;
    
    // Update button state
    function updateButtonState() {
      const remaining = maxPicks - selectedCount;
      
      if (remaining === 0) {
        voteButton.disabled = false;
        voteButton.classList.remove('disabled');
        voteButton.textContent = 'Submit Your Votes!';
      } else {
        voteButton.disabled = true;
        voteButton.classList.add('disabled');
        voteButton.textContent = 'Pick ' + remaining + ' more!';
      }
    }
    
    // Handle checkbox changes
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        selectedCount = document.querySelectorAll('input[type="checkbox"][name="year_end_votes[]"]:checked').length;
        
        // Disable further selections if max reached
        if (selectedCount >= maxPicks) {
          checkboxes.forEach(cb => {
            if (!cb.checked) cb.disabled = true;
          });
        } else {
          checkboxes.forEach(cb => {
            cb.disabled = false;
          });
        }
        
        updateButtonState();
      });
    });
    
    // Handle write-in field
    if (writeInCheckbox && writeInField) {
      writeInCheckbox.addEventListener('change', function() {
        writeInField.disabled = !this.checked;

        if (this.checked) {
          // Only count write-in if it has text
          const hasText = writeInField.value.trim() !== '';
          if (hasText) {
            selectedCount++;
            if (selectedCount >= maxPicks) {
              checkboxes.forEach(cb => {
                if (!cb.checked) cb.disabled = true;
              });
            }
          }
        } else {
          selectedCount--;
          checkboxes.forEach(cb => {
            cb.disabled = false;
          });
        }

        updateButtonState();
      });

      // Also check when text is entered/removed
      writeInField.addEventListener('input', function() {
        const wasChecked = writeInCheckbox.checked;
        const hasText = this.value.trim() !== '';

        if (wasChecked) {
          // Recalculate count based on whether there's text
          const checkedBoxes = document.querySelectorAll('input[type="checkbox"][name="year_end_votes[]"]:checked').length;
          selectedCount = checkedBoxes + (hasText ? 1 : 0);

          if (selectedCount >= maxPicks) {
            checkboxes.forEach(cb => {
              if (!cb.checked) cb.disabled = true;
            });
          } else {
            checkboxes.forEach(cb => {
              cb.disabled = false;
            });
          }

          updateButtonState();
        }
      });
    }
    
    // Initial state
    updateButtonState();
  });
</script>
