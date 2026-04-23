<?php

if ($page_file != "logout.php") {
    login_check();
}

// CP pages always use MySQL — they're legacy and will be replaced by Payload CMS
if (strpos($_SERVER['SCRIPT_NAME'] ?? '', '/cp/') !== false) {
    require_once __DIR__ . '/../models/FeatureManager.php';
    \YNotRadio\Models\FeatureManager::setCpContext();
}

#error_reporting( E_ALL);
#ini_set('display_errors', '1 ');

?>
<!DOCTYPE hmtl PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
      <meta http-equiv="Content-Language" content="en-us"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <meta name="description" content="YNot Radio" />
      <meta name="keywords" content="Y-Not Radio, ynot radio, y-not, ynot, Y-Not Philly, ynot philly, Y100, Y100 Philadelphia, Y100 Philly, y100 rocks, Philadelphia music, Philly music, indie rock, Josh T. Landow, Josh Landow" />
      <meta name="author" content="YNot Radio" />
      <title><?php if ($page_title) {echo "$page_title | ";} ?> Y-Not Radio </title>
      <link rel="shortcut icon" href="/imgs/favicon.ico" />
      <!-- -->
      <!-- -->
      <!-- -->
      <!-- Contribute at https://github.com/ynotradio -->
      <!-- -->
      <!-- -->
      <!-- -->
      <!-- social meta start -->
      <meta property="og:site_name" content="YNot Radio">
      <meta property="og:image" content="https://www.ynotradio.net/imgs/ynot-fb.jpg">
      <meta property="og:title" content="YNot Radio">
      <meta property="og:description" content="YNot Radio | Philadelphia's Real Alternative">
      <meta property="og:type" content="article">
      <meta property="og:url" content="https://www.ynotradio.net">
      <!-- social meta end -->
    <!--[if lte IE 8]>
    <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
      <?php
      // Determine if we're in the /cp directory to adjust paths
      $base_path = (strpos($page_file, 'cp/') !== false || dirname($_SERVER['PHP_SELF']) == '/cp') ? "../" : "";

      // Cache busting: append file modification time as query string
      $css_file = __DIR__ . '/../style/base.css';
      $css_version = file_exists($css_file) ? filemtime($css_file) : time();
      ?>
      <link href="<?php echo $base_path; ?>style/base.css?v=<?php echo $css_version; ?>" rel="stylesheet" type="text/css" media="all">
      <?php if ($page_file == "madness.php" || $page_file == "madness_sandbox.php" || $page_file == "madness_view.php") {
    $madness_css = __DIR__ . '/../style/madness.css';
    $madness_version = file_exists($madness_css) ? filemtime($madness_css) : time();
    echo "<link href=\"" . $base_path . "style/madness.css?v=" . $madness_version . "\" rel=\"stylesheet\" type=\"text/css\" media=\"all\">\n";
}
?>

      <!-- <script type="text/javascript" src="js/jquery-1.7.1.js"></script> -->
      <script type="text/javascript" src="https://code.jquery.com/jquery-1.7.1.min.js"></script>
      <!--http://code.jquery.com/jquery-1.7.1.min.js -->

      <script src="<?php echo $base_path; ?>js/picker.js"></script>
      <script src="<?php echo $base_path; ?>js/picker.date.js"></script>
      <script src="<?php echo $base_path; ?>js/picker.time.js"></script>
      <script src="<?php echo $base_path; ?>js/legacy.js"></script>
      <script src="<?php echo $base_path; ?>js/init.js"></script>
      <?php if ($page_file == "madness.php" || $page_file == "madness_sandbox.php" || $page_file == "madness_view.php") {
    $js_dir = __DIR__ . '/../js/';
    $js_comp_dir = $js_dir . 'components/';
    $bm_v = file_exists($js_comp_dir . 'mrm-bracket-match.js') ? filemtime($js_comp_dir . 'mrm-bracket-match.js') : time();
    $sb_v = file_exists($js_comp_dir . 'mrm-scoreboard.js') ? filemtime($js_comp_dir . 'mrm-scoreboard.js') : time();
    $mc_v = file_exists($js_comp_dir . 'mrm-match-card.js') ? filemtime($js_comp_dir . 'mrm-match-card.js') : time();
    echo "<script type=\"text/javascript\" src=\"" . $base_path . "js/components/mrm-bracket-match.js?v=" . $bm_v . "\"></script>";
    echo "<script type=\"text/javascript\" src=\"" . $base_path . "js/components/mrm-scoreboard.js?v=" . $sb_v . "\"></script>";
    echo "<script type=\"text/javascript\" src=\"" . $base_path . "js/components/mrm-match-card.js?v=" . $mc_v . "\"></script>";
}

?>
      <?php if ($page_file == "madness.php" || $page_file == "madness_sandbox.php") {
    $vb_v = file_exists($js_dir . 'mrm-vote-bridge.js') ? filemtime($js_dir . 'mrm-vote-bridge.js') : time();
    echo "<script type=\"text/javascript\" src=\"" . $base_path . "js/mrm-vote-bridge.js?v=" . $vb_v . "\"></script>";
}

?>
      <?php if ($page_file == "madness.php" || $page_file == "madness_sandbox.php") {
    $cd_v = file_exists($js_dir . 'countdown.js') ? filemtime($js_dir . 'countdown.js') : time();
    echo "<script type=\"text/javascript\" src=\"" . $base_path . "js/countdown.js?v=" . $cd_v . "\"></script>";
}

?>
      <?php if ($page_file == "yearendpoll.php") {
    echo "<script type=\"text/javascript\" src=\"js/year_end_poll.js\"></script>";
}

?>
      <script type="text/javascript" src="<?php echo $base_path; ?>js/common_functions.js"></script>

    </head>
    <?php
if ($page_file == "yearendpoll.php") {
    echo "<body onload=\"init()\">";
} else {
    echo "<body>";
}

?>
      <div id="fb-root"></div>
      <script>(function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=272336702790140";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));</script>
      <div id="container">
      <header>
        <div class="header-bitmap">
          <img src="<?php echo $base_path; ?>imgs/header_front_2022.png" alt="logo" usemap="#Map"/>
          <iframe src="<?php echo $base_path; ?>partials/_now_playing.php" name="iradiophillyplaylist" scrolling="no" noresize="" frameborder="No" marginwidth="0" marginheight="0" width="445" height="125"></iframe>
          <map name="Map">
            <area shape="rect" coords="20,5,310,150" href="http://www.ynotradio.net" alt="Y-Not Radio"/>
            <area shape="rect" coords="340,10,452,85" href="https://player.live365.com/ynotradio" alt="Listen Live" target="_blank"/>
            <area shape="rect" coords="337,93,447,102" href=" https://api.live365.com/play/a54553.m3u" target="_blank" alt="iTunes">
            <area shape="rect" coords="328,115,372,149" href="https://www.facebook.com/ynotradio" alt="facebook" target="_blank"/>
            <area shape="rect" coords="382,115,410,149" href="http://twitter.com/ynotradio" alt="twitter" target="_blank"/>
            <area shape="rect" coords="414,115,447,149" href="mobile.php" alt="mobile"/>
          </map>
        </div>
        <?php
require_once __DIR__ . '/_now_playing_data.php';
$np = ynot_get_now_playing();
$np_artist = $np['currentTrack']['artist'] ?? '';
$np_title = $np['currentTrack']['title'] ?? 'Y-Not Radio';
$np_marquee = $np['available'] && ($np_artist || $np_title)
    ? trim($np_artist . ($np_artist && $np_title ? ' – ' : '') . $np_title)
    : 'Y-Not Radio — Philadelphia\'s Real Alternative';
$on_air = on_air();
?>
        <div class="header-mobile">
          <!-- Zone 1: Logo hero on textured concrete -->
          <a class="header-mobile__brand" href="<?php echo $base_path; ?>index.php" aria-label="Y-Not Radio home">
            <img src="<?php echo $base_path; ?>imgs/ynot-logo.svg" alt="Y-Not Radio"/>
          </a>

          <!-- Zone 2: Three-column action bar -->
          <div class="header-mobile__actions" role="group" aria-label="Player controls">
            <a class="action-btn action-btn--live" href="https://player.live365.com/ynotradio" target="_blank" rel="noopener">
              <span class="action-btn__icon" aria-hidden="true">▶</span>
              <span class="action-btn__label">Listen Live</span>
            </a>
            <button type="button" class="action-btn action-btn--onair" aria-expanded="false" aria-controls="np-panel">
              <span class="action-btn__row">
                <span class="onair-dot" aria-hidden="true"></span>
                <span class="action-btn__eyebrow">On Air</span>
              </span>
              <span class="action-btn__row">
                <span class="action-btn__label"><?php echo htmlspecialchars($on_air !== '' ? $on_air : 'Y-Not Radio'); ?></span>
                <span class="action-btn__chevron" aria-hidden="true">▾</span>
              </span>
            </button>
            <button type="button" class="action-btn action-btn--menu" aria-expanded="false" aria-controls="mobile-drawer">
              <span class="hamburger" aria-hidden="true"><span></span><span></span><span></span></span>
              <span class="action-btn__label">Menu</span>
            </button>
          </div>

          <!-- Zone 2b: Recently played expandable panel -->
          <div id="np-panel" class="np-panel" hidden>
            <div class="np-panel__inner">
              <span class="np-panel__eyebrow">Recently Played</span>
              <ol class="np-panel__list" data-recent-list>
                <?php
                $recent = array_slice($np['lastPlayed'], 0, 4);
                if (empty($recent)) {
                    echo '<li class="np-panel__empty">Track history unavailable</li>';
                } else {
                    foreach ($recent as $t) {
                        $a = htmlspecialchars($t['artist'] ?? '');
                        $ti = htmlspecialchars($t['title'] ?? '');
                        echo '<li><strong>' . $a . '</strong>';
                        if ($a && $ti) {
                            echo ' <span class="np-panel__sep">–</span> ';
                        }
                        echo '<em>' . $ti . '</em></li>';
                    }
                }
                ?>
              </ol>
            </div>
          </div>

          <!-- Zone 3: Persistent marquee strip -->
          <div class="np-marquee" aria-live="off">
            <span class="np-marquee__badge">Now Playing</span>
            <div class="np-marquee__viewport">
              <span class="np-marquee__text" data-default="<?php echo htmlspecialchars($np_marquee); ?>"><?php echo htmlspecialchars($np_marquee); ?></span>
            </div>
          </div>
        </div>

        <?php
if ($on_air != '') {
    echo "<div id=\"on-air\">" . $on_air . "</div>";
}
?>
      </header>
      <nav>
        <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
          <span>Menu</span>
        </button>
        <ul>
        <?php
$nav = array("index.php" => "Home", "concerts.php" => "Concerts", "top11.php" => "Top 11 @ 11", "music.php" => "New Music", "schedule.php" => "Schedule", "deejays.php" => "Dee Jays", "ondemand.php" => "On Demand", "cdoftheweek.php" => "CD of The Week", "ymail.php" => "Y-Mail", "donate.php" => "Donate");
foreach ($nav as $url => $title) {
    $last_class = '';
    if (end($nav) == $title) {
        $last_class = "class =\"last\"";
    }
    //silly IE Hack for last
    if ($url == $page_file) {
        echo "<li $last_class><a href=\"" . $base_path . $url . "\" class=\"active\">$title</a></li>\n";
    } else {
        echo "<li $last_class><a href=\"" . $base_path . $url . "\">$title</a></li>\n";
    }

}
?>
        </ul>
      </nav>

      <!-- Mobile slide-in drawer (rendered for all viewports; CSS hides on desktop) -->
      <div class="mobile-drawer-overlay" hidden></div>
      <aside id="mobile-drawer" class="mobile-drawer" aria-hidden="true" aria-label="Site menu">
        <div class="mobile-drawer__logo">
          <img src="<?php echo $base_path; ?>imgs/ynot-logo.svg" alt="Y-Not Radio"/>
          <button type="button" class="mobile-drawer__close" aria-label="Close menu">&times;</button>
        </div>
        <?php if ($on_air != ''): ?>
          <div class="mobile-drawer__onair">
            <span class="mobile-drawer__onair-dot" aria-hidden="true"></span>
            On Air: <?php echo htmlspecialchars($on_air); ?>
          </div>
        <?php endif; ?>
        <div class="mobile-drawer__np">
          <span class="mobile-drawer__np-label">Now Playing</span>
          <span class="mobile-drawer__np-track">
            <strong><?php echo htmlspecialchars($np_artist); ?></strong>
            <?php if ($np_artist && $np_title): ?> – <?php endif; ?>
            <em><?php echo htmlspecialchars($np_title); ?></em>
          </span>
        </div>
        <nav class="mobile-drawer__nav" aria-label="Primary">
          <?php foreach ($nav as $url => $title): ?>
            <a href="<?php echo $base_path . $url; ?>"<?php if ($url == $page_file) echo ' class="active" aria-current="page"'; ?>><?php echo $title; ?></a>
          <?php endforeach; ?>
        </nav>
        <div class="mobile-drawer__social">
          <a href="https://www.facebook.com/ynotradio" target="_blank" rel="noopener" aria-label="Facebook">f</a>
          <a href="http://twitter.com/ynotradio" target="_blank" rel="noopener" aria-label="Twitter">t</a>
        </div>
      </aside>
