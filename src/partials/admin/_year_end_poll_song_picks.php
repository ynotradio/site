<?php
// filepath: /workspaces/site/src/partials/admin/_year_end_poll_song_picks.php
/**
 * This partial renders a contestant's song picks
 * 
 * Expected variables:
 * - $contestant: array - Contestant data
 * - $songVotes: array - Song votes data
 */
?>

<div class="row">
  <div class="twelve columns content full-width">
    <h2><?php echo ucwords(htmlspecialchars($contestant['name'])); ?>'s Top 20 Songs</h2>
    
    <?php if ($contestant['contest'] != 'yes'): ?>
      <div class="center">
        <strong>This contestant does not wish to participate in the contest</strong>
      </div>
    <?php else: ?>
      <ul>
        <?php for ($i = 1; $i <= 20; $i++): ?>
          <?php 
          $songId = $songVotes['song' . $i];
          $song = $controller->getSong($songId);
          ?>
          
          <?php if ($song): ?>
            <li><?php echo htmlspecialchars($song['artist'] . ' - ' . $song['title']); ?></li>
          <?php else: ?>
            <li><b>WRITE IN:</b> <?php echo htmlspecialchars($songId); ?></li>
          <?php endif; ?>
        <?php endfor; ?>
      </ul>
    <?php endif; ?>
  </div>
</div>
