<?php
$ad = $ad ?? [];
$name = $ad['name'] ?? '';
$start_date = $ad['start_date'] ?? '';
$end_date = $ad['end_date'] ?? '';
$pic_url = $ad['pic_url'] ?? '';
$web_url = $ad['web_url'] ?? '';
$priority = $ad['priority'] ?? '';
$action = ($name === '') ? 'insert' : 'update';
$button_class = ($action === 'insert') ? 'btn-success' : 'btn-info';
$button_label = ($action === 'insert') ? 'Add Ad' : 'Update Ad';
?>
<fieldset>
  <div class="control-group">
    <label class="required">Name</label>
    <div class="control">
      <input type="text" name="name" class="input-l" value="<?= htmlspecialchars($name) ?>">
    </div>
  </div>
  <div class="control-group">
    <label class="required">Start Date</label>
    <div class="control">
      <input type="text" name="start_date" class="date" placeholder="YYYY/MM/DD" value="<?= htmlspecialchars($start_date) ?>">
    </div>
  </div>
  <div class="control-group">
    <label class="required">End Date</label>
    <div class="control">
      <input type="text" name="end_date" class="date" placeholder="YYYY/MM/DD" value="<?= htmlspecialchars($end_date) ?>">
    </div>
  </div>
  <div class="control-group">
    <label class="required">Picture Url</label>
    <div class="control">
      <input type="text" name="pic_url" class="input-xl" value="<?= htmlspecialchars($pic_url) ?>">
    </div>
  </div>
  <div class="control-group">
    <label class="required">Link Url</label>
    <div class="control">
      <input type="text" name="web_url" class="input-xl" value="<?= htmlspecialchars($web_url) ?>">
    </div>
  </div>
  <div class="control-group">
    <label class="required">Priority</label>
    <div class="control">
      <input type="text" name="priority" class="input-s" value="<?= htmlspecialchars($priority) ?>">
    </div>
  </div>
  <div class="form-actions">
    <input type="hidden" name="action" value="<?= $action ?>">
    <input type="submit" class="<?= $button_class ?>" value="<?= $button_label ?>">
  </div>
</fieldset>
