<?php
// filepath: /workspaces/site/src/partials/admin/_year_end_poll_contestants.php
/**
 * This partial renders all Year End Poll contestants
 * 
 * Expected variables:
 * - $contestants: array - List of all contestants
 */
?>

<div class="row">
  <div class="twelve columns content full-width">
    <h1>Year End Poll Contestants</h1>
    
    <table class="table table-striped table-bordered-horizontal table-condensed table-center">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>City</th>
          <th>Contest</th>
          <th>Newsletter</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($contestants as $contestant): ?>
          <tr>
            <td>
              <?php if ($contestant['contest'] == 'yes'): ?>
                <a href="year_end_poll_song_picks.php?contestant_id=<?php echo $contestant['id']; ?>">
                  <?php echo ucwords(htmlspecialchars($contestant['name'])); ?>
                </a>
              <?php else: ?>
                <?php echo ucwords(htmlspecialchars($contestant['name'])); ?>
              <?php endif; ?>
            </td>
            <td><?php echo htmlspecialchars($contestant['email']); ?></td>
            <td><?php echo htmlspecialchars($contestant['phone']); ?></td>
            <td><?php echo ucwords(htmlspecialchars($contestant['hometown'])); ?></td>
            <td><?php echo htmlspecialchars($contestant['contest']); ?></td>
            <td><?php echo htmlspecialchars($contestant['newsletter']); ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    
    <p>Click on the name to see their picks.</p>
  </div>
</div>
