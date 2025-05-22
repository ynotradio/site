<?php
$currentFile = basename($_SERVER['PHP_SELF']);
$formAction = $currentFile . ($id ? "?id=" . $id : "");
?>
<form action="<?php echo $formAction; ?>" method="post" class="form-internal inline input-seperation" id="admin">
<fieldset>
    <div class="control-group">
        <label class="required">Artist</label>
        <div class="control">
            <input type="text" name="artist" class="input-l" value="<?php echo htmlspecialchars($cdotw["artist"]); ?>">
        </div>
    </div>
    <div class="control-group">
        <label class="required">Title</label>
        <div class="control">
            <input type="text" name="title" class="input-l" value="<?php echo htmlspecialchars($cdotw["title"]); ?>">
        </div>
    </div>
    <div class="control-group">
        <label class="required">Label</label>
        <div class="control">
            <input type="text" name="label" class="input-l" value="<?php echo htmlspecialchars($cdotw["label"]); ?>">
        </div>
    </div>
    <div class="control-group">
        <label class="required">Review</label>
        <div class="control">
            <textarea name="review" rows="20" class="input-xl"><?php echo htmlspecialchars($cdotw["review"]); ?></textarea>
        </div>
    </div>
    <div class="control-group">
        <label class="required">Cover Url</label>
        <div class="control">
            <input type="text" name="cd_pic_url" class="input-xl" value="<?php echo htmlspecialchars($cdotw["cd_pic_url"]); ?>">
        </div>
    </div>
    <div class="control-group">
        <label class="required">Band Url</label>
        <div class="control">
            <input type="text" name="band" class="input-xl" value="<?php echo htmlspecialchars($cdotw["band"]); ?>">
        </div>
    </div>
    <div class="control-group">
        <label class="required">Reviewer</label>
        <div class="control">
            <input type="text" name="reviewer" class="input-l" value="<?php echo htmlspecialchars($cdotw["reviewer"]); ?>">
        </div>
    </div>
    <div class="control-group">
        <label class="required">Date</label>
        <div class="control">
            <input type="text" name="date" class="date" placeholder="YYYY/MM/DD" value="<?php echo htmlspecialchars($cdotw["date"]); ?>">
        </div>
    </div>
    <div class="form-actions">
        <?php if ($cdotw['artist'] == ''): ?>
            <input type="hidden" name="action" value="insert">
            <input type="submit" class="btn-success" value="Add CD of the Week">
        <?php else: ?>
            <input type="hidden" name="action" value="update">
            <input type="submit" class="btn-info" value="Update CD of the Week">
        <?php endif; ?>
    </div>
</fieldset>
</form>
