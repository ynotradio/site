<?php

$page_file = "experiments.php";
$page_title = "Experiments";

require ("../functions/main_fns.php");

// Handle POST actions BEFORE any output
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $action = $_POST['action'] ?? '';

  if ($action === 'add_flag') {
    $newFlag = trim($_POST['new_flag'] ?? '');
    if (!empty($newFlag)) {
      // Get current flags
      $currentFlags = isset($_COOKIE['FF']) ? explode(',', $_COOKIE['FF']) : [];

      // Add new flag if not already present
      if (!in_array($newFlag, $currentFlags)) {
        $currentFlags[] = $newFlag;
        $cookieValue = implode(',', $currentFlags);
        setcookie('FF', $cookieValue, time() + (86400 * 30), '/'); // 30 days
        $_COOKIE['FF'] = $cookieValue; // Update for current page load
        $message = "Flag '$newFlag' added successfully.";
        $messageType = 'success';
      } else {
        $message = "Flag '$newFlag' already exists.";
        $messageType = 'info';
      }
    }
  } elseif ($action === 'remove_flag') {
    $flagToRemove = $_POST['flag_to_remove'] ?? '';
    if (!empty($flagToRemove)) {
      // Get current flags
      $currentFlags = isset($_COOKIE['FF']) ? explode(',', $_COOKIE['FF']) : [];

      // Remove the flag
      $currentFlags = array_filter($currentFlags, function($flag) use ($flagToRemove) {
        return $flag !== $flagToRemove;
      });

      if (empty($currentFlags)) {
        // No flags left, delete the cookie
        setcookie('FF', '', time() - 3600, '/');
        unset($_COOKIE['FF']);
        $message = "Flag '$flagToRemove' removed. No flags remaining.";
      } else {
        $cookieValue = implode(',', $currentFlags);
        setcookie('FF', $cookieValue, time() + (86400 * 30), '/');
        $_COOKIE['FF'] = $cookieValue;
        $message = "Flag '$flagToRemove' removed successfully.";
      }
      $messageType = 'success';
    }
  } elseif ($action === 'clear_all') {
    setcookie('FF', '', time() - 3600, '/');
    unset($_COOKIE['FF']);
    $message = "All feature flags cleared.";
    $messageType = 'success';
  }
}

// Get current flags
$currentFlags = isset($_COOKIE['FF']) ? explode(',', $_COOKIE['FF']) : [];

require ("../partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Experiments - Feature Flags</h1>

    <?php if ($message): ?>
      <div class="alert alert-<?php echo $messageType; ?> top-spacer_20">
        <?php echo htmlspecialchars($message); ?>
      </div>
    <?php endif; ?>

    <div class="top-spacer_20">
      <h2>Current Feature Flags</h2>
      <?php if (empty($currentFlags)): ?>
        <p><em>No feature flags currently set.</em></p>
      <?php else: ?>
        <ul>
          <?php foreach ($currentFlags as $flag): ?>
            <li>
              <strong><?php echo htmlspecialchars($flag); ?></strong>
              <form method="post" style="display: inline;">
                <input type="hidden" name="action" value="remove_flag">
                <input type="hidden" name="flag_to_remove" value="<?php echo htmlspecialchars($flag); ?>">
                <button type="submit" class="btn-danger btn-small" onclick="return confirm('Remove flag \'<?php echo htmlspecialchars($flag); ?>\'?');">Remove</button>
              </form>
            </li>
          <?php endforeach; ?>
        </ul>

        <form method="post" class="top-spacer_20">
          <input type="hidden" name="action" value="clear_all">
          <button type="submit" class="btn-warning" onclick="return confirm('Clear all feature flags?');">Clear All Flags</button>
        </form>
      <?php endif; ?>
    </div>

    <div class="top-spacer_20">
      <h2>Add Feature Flag</h2>
      <form method="post" class="form-default">
        <input type="hidden" name="action" value="add_flag">
        <label>Flag Name</label>
        <div class="controls">
          <input type="text" name="new_flag" class="input-l" placeholder="e.g., auth_voting" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-info">Add Flag</button>
        </div>
      </form>
    </div>

    <div class="top-spacer_20">
      <h2>Available Flags</h2>
      <dl>
        <dt><code>auth_voting</code></dt>
        <dd>Enables authenticated voting for Top 11 @ 11 (requires Auth0 login)</dd>
        <dt><code>sanity</code></dt>
        <dd>Enables Sanity CMS as the data source for concerts (instead of MySQL)</dd>
        <dt><code>sanity_deejays</code></dt>
        <dd>Enables Sanity CMS as the data source for deejays (instead of MySQL)</dd>
      </dl>
    </div>

    <div class="top-spacer_20">
      <a href="index.php">← Back to Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
