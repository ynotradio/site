<?php
                               
$page_file = "mrm_add_band.php";
$page_title = "Add a Modern Rock Band";

require ("functions/main_fns.php");
require ("functions/mrm_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];
	
if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Modern Rock Madness Band</h1>
    <?php if ($action != "insert") { ?>
    <form action="mrm_add_band.php" method="post" class="form-internal inline input-seperation" id="admin">
      <?php require ("partials/_mrm_band_form.php"); ?>
    </form>
    <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
  <?php
    } else {
      $name = $_POST['name'];
      $url = $_POST['url'];
      $pic_url = $_POST['pic_url'];
      $placement = $_POST['placement'];
      $seed = $_POST['seed'];
      $abbr = $_POST['abbr'];

      if (!$name || !$url || !$pic_url || !$placement || !$seed || !$abbr)
        echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
      else
        add_mrm_band($name, $url, $pic_url, $placement, $seed, $abbr);
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Band</a>\n<p>";
      ?>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
