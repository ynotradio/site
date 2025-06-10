<?php
// filepath: /workspaces/site/src/partials/admin/_year_end_poll_results.php
/**
 * This partial renders the results for a specific Year End Poll
 * 
 * Expected variables:
 * - $pollName: string - The name of the poll
 * - $columnNames: array - Column names for the poll table
 * - $pollResults: array - Results with vote counts
 */
?>

<div class="row">
  <div class="twelve columns content full-width">
    <h1>Year End Poll Results: <?php echo ucwords($controller->formatPollName($pollName)); ?></h1>
    
    <table class="table table-striped table-bordered-horizontal table-condensed table-center">
      <thead>
        <tr>
          <?php foreach ($columnNames as $columnName): ?>
            <?php if ($columnName !== 'id'): ?>
              <th><?php echo ucwords($controller->formatPollName($columnName)); ?></th>
            <?php endif; ?>
          <?php endforeach; ?>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($pollResults as $result): ?>
          <tr>
            <?php foreach ($columnNames as $columnName): ?>
              <?php if ($columnName !== 'id'): ?>
                <td><?php echo htmlspecialchars($result[$columnName]); ?></td>
              <?php endif; ?>
            <?php endforeach; ?>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
