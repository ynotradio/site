<?php
/**
 * Champion Winner Banner Partial
 * 
 * Displays the tournament champion with congratulations message
 * 
 * Expected variables:
 * - $championData: array with 'name', 'pic_url', and 'year' keys
 */

if (!isset($championData) || !is_array($championData)) {
    throw new InvalidArgumentException('Champion data is required');
}

$requiredKeys = ['name', 'pic_url', 'year'];
foreach ($requiredKeys as $key) {
    if (!isset($championData[$key])) {
        throw new InvalidArgumentException("Champion data missing required key: {$key}");
    }
}
?>

<div class="center">
    <h2>Congratulations to your <?php echo htmlspecialchars($championData['year']); ?> <br>Y-Not Modern Rock Madness Champions</h2>
    <h1><?php echo htmlspecialchars($championData['name']); ?>!</h1>
    <img src="<?php echo htmlspecialchars($championData['pic_url']); ?>" height="200px">
</div>
