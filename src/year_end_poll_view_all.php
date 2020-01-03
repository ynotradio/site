<?php

$page_file = "year_end_poll_view_all.php";
$page_title = "View All Year End Polls";

require ("functions/main_fns.php");
require ("functions/year_end_poll_fns.php");
require ("partials/_header.php");

$poll = 'songs';
if ($_POST['poll'] != ''){
	$poll = $_POST['poll'];
}
if ($_GET['poll'] != ''){
	$poll = ucwords($_GET['poll']);
}

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Year End Polls | <?php echo ucwords(format_poll_name($poll)) ?> </h1>
    <form action="year_end_poll_view_all.php" method="post">
      <select name="poll" onchange="javascript:this.form.submit();">
      <?php $polls = get_poll_names();
                        
      foreach ($polls as $pollvalue => $title) {
          if ($title == $poll)
            echo '<option value="'.$title.'" selected="'. $title .'">' . ucwords(format_poll_name($title)) . '</option>'. "\n";
          else
            echo '<option value="'.$title.'">' . ucwords(format_poll_name($title)) . '</option>'. "\n";
          } ?>
      </select>
    </form>
  <div class="row">
    <div class="tweleve columns content full-width">
    <?php view_all_year_end_poll_for($poll); ?>
    </div>
  </div>
  <?php view_all_year_end_poll_write_ins_for($poll); ?>

    <div class="top-spacer_20">
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
