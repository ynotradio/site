<?php
// filepath: /workspaces/site/src/partials/admin/_year_end_poll_write_ins.php
/**
 * This partial renders the write-ins for a specific Year End Poll
 * 
 * Expected variables:
 * - $pollName: string - The name of the poll
 * - $writeIns: array - All write-in entries
 */
?>

<div class="row">
  <div class="twelve columns content full-width">
    <h2>Write-ins for <?php echo ucwords($controller->formatPollName($pollName)); ?></h2>
    
    <?php if (empty($writeIns)): ?>
      <h3>There are no write-ins.</h3>
    <?php else: ?>
      <ul>
        <?php foreach ($writeIns as $writeIn): ?>
          <li><?php echo htmlspecialchars($writeIn['write_in']); ?></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </div>
</div>
