<?php
// Process time values before rendering the form
$start_time_formatted = '';
$end_time_formatted = '';

if (!empty($schedule["start_time"])) {
  $timestamp = strtotime($schedule["start_time"]);
  $start_time_formatted = date('h:i A', $timestamp); // 12-hour format with AM/PM
}

if (!empty($schedule["end_time"])) {
  $timestamp = strtotime($schedule["end_time"]);
  $end_time_formatted = date('h:i A', $timestamp); // 12-hour format with AM/PM
}
?>
<fieldset>
  <div class="control-group">
    <label class="required">Host</label>
    <div class="control">
      <input type="text" name="host" class="inputl" value="<?= htmlspecialchars($schedule["host"] ?? '') ?>">
    </div>
  </div>

  <div class="control-group">
    <label class="required">Date</label>
    <div class="control">
      <input type="text" name="date" class="date" placeholder="YYYY/MM/DD" value="<?= htmlspecialchars($schedule["date"] ?? '') ?>">
    </div>
  </div>

  <div class="control-group">
    <label class="required">Start Time</label>
    <div class="control">
      <input type="text" name="start_time" class="time" placeholder="HH:MM AM/PM" value="<?= htmlspecialchars($start_time_formatted) ?>">
    </div>
  </div>

  <div class="control-group">
    <label class="required">End Time</label>
    <div class="control">
      <input type="text" name="end_time" class="time" placeholder="HH:MM AM/PM" value="<?= htmlspecialchars($end_time_formatted) ?>">
    </div>
  </div>

  <div class="control-group">
    <label>Notes</label>
    <div class="control">
      <textarea name="note" cols="40" rows="5"><?= htmlspecialchars($schedule["note"] ?? '') ?></textarea>
    </div>
  </div>

  <div class="form-actions">
    <?php if ($schedule['host'] == ''): ?>
      <input type="hidden" name="action" value="insert">
      <input type="submit" class="btn-success" value="Add Schedule">
    <?php elseif ($action == "copy"): ?>
      <input type="hidden" name="action" value="insert">
      <input type="submit" class="btn-inverse" value="Copy Schedule">
    <?php else: ?>
      <input type="hidden" name="action" value="update">
      <input type="submit" class="btn-info" value="Update Schedule">
    <?php endif; ?>
  </div>
</fieldset>
