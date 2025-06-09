<?php
/**
 * Partial for displaying sponsor information
 * 
 * @param array $sponsorInfo Sponsor information (name, message)
 */

// Ensure required data is available
if (empty($sponsorInfo) || empty($sponsorInfo['name'])) {
    return;
}
?>
<div class="sponsor">
    <strong>Match sponsored by: <?php echo htmlspecialchars($sponsorInfo['name']); ?></strong>
    <?php if (!empty($sponsorInfo['message'])): ?>
        <div class="sponsor-message"><?php echo htmlspecialchars($sponsorInfo['message']); ?></div>
    <?php endif; ?>
</div>
