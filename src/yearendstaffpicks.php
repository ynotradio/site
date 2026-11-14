<?php

$page_file = "yearendstaffpicks.php";
$page_title = "Year End Staff Picks";

require "functions/main_fns.php";
require "models/YearEndStaffPickFactory.php";
require "partials/_header.php";

$staffPickModel = \YNotRadio\Models\YearEndStaffPickFactory::create();

try {
  $year = $staffPickModel->getYear();
  $staffPicks = $staffPickModel->getAll();
} catch (\Exception $err) {
  error_log("Staff picks: " . $err->getMessage());
  $year = null;
  $staffPicks = [];
}

$e = function ($text) {
  return htmlspecialchars((string)$text, ENT_QUOTES);
};
?>
<div class="row">
  <div class="twelve columns content">
    <h1><?= $year ? $e($year) . ' ' : '' ?>Y-Not Staff Favorites</h1>
    <p><a href="yearendpoll.php">Go back to the Year End Poll</a></p>

    <?php if (!$staffPicks): ?>
      <p>Staff picks are coming soon.</p>
    <?php endif; ?>

    <?php foreach ($staffPicks as $pick): ?>
      <table class="year_end_staff_pick">
        <tr>
          <td colspan="2" class="bottom-spacer_20">
            <div style="float: left;">
              <strong><?= $e($pick['name']) ?><?php if ($pick['showName'] !== ''): ?><br><em><?= $e($pick['showName']) ?></em><?php endif; ?></strong>
            </div>
            <div style="float: right;">
              <strong><?= implode('<br>', array_map($e, $pick['details'])) ?></strong>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%">
            <?php if ($pick['songs']): ?>
              <h3><u>Top <?= count($pick['songs']) ?> Songs</u></h3>
              <ol>
                <?php foreach ($pick['songs'] as $song): ?>
                  <li><?= $e($song['artist']) ?><?= $song['artist'] !== '' ? ' ' : '' ?>"<?= $e($song['title']) ?>"</li>
                <?php endforeach; ?>
              </ol>
            <?php endif; ?>
          </td>
          <td width="50%">
            <?php if ($pick['albums']): ?>
              <h3><u>Top <?= count($pick['albums']) ?> Albums</u></h3>
              <ol>
                <?php foreach ($pick['albums'] as $album): ?>
                  <li><?= $e($album['artist']) ?><?= $album['artist'] !== '' ? ' - ' : '' ?><i><?= $e($album['title']) ?></i></li>
                <?php endforeach; ?>
              </ol>
            <?php endif; ?>
            <?php foreach ($pick['players'] as $src): ?>
              <iframe width="100%" height="60" src="<?= $e($src) ?>" frameborder="0" allow="encrypted-media; fullscreen; autoplay"></iframe>
            <?php endforeach; ?>
          </td>
        </tr>
      </table>
      <br>
    <?php endforeach; ?>
  </div>
</div>
<?php require "partials/_footer.php"; ?>
