<?php

$page_file = "image_view_all.php";
$page_title = "View All Images";

require("../functions/main_fns.php");
require("../partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'], $_POST['remember_me'], $_SESSION["error"]);
} else {

  /*----- CONTENT ------*/
?>
  <div class="row">
    <div class="tweleve columns content full-width">
      <h1>View all Images</h1>
      <ol>
        <?php
        // Static list of images from database as of June 11, 2025
        $images = [
          [
            'id' => 3,
            'file' => 'adrienne.jpeg'
          ],
          [
            'id' => 147,
            'file' => 'ahahahasnooooooo.png'
          ],
          [
            'id' => 72,
            'file' => 'alecsmith.jpg'
          ],
          [
            'id' => 4,
            'file' => 'amy_g.jpg'
          ],
          [
            'id' => 5,
            'file' => 'andre.jpg'
          ],
          [
            'id' => 45,
            'file' => 'ashley.jpg'
          ],
          [
            'id' => 122,
            'file' => 'aussie_unlocked_logo.png'
          ],
          [
            'id' => 73,
            'file' => 'bayley.jpg'
          ],
          [
            'id' => 6,
            'file' => 'bek_henson.jpg'
          ],
          [
            'id' => 40,
            'file' => 'bek_henson.jpg'
          ],
          [
            'id' => 41,
            'file' => 'bobgrant.jpg'
          ],
          [
            'id' => 7,
            'file' => 'brendan_mcnulty.jpg'
          ],
          [
            'id' => 131,
            'file' => 'bryne-yancey.jpg'
          ],
          [
            'id' => 110,
            'file' => 'bunker_sessions_2013_web.jpg'
          ],
          [
            'id' => 152,
            'file' => 'c99.php'
          ],
          [
            'id' => 153,
            'file' => 'c99.php'
          ],
          [
            'id' => 43,
            'file' => 'carrie.jpg'
          ],
          [
            'id' => 8,
            'file' => 'cat.jpg'
          ],
          [
            'id' => 123,
            'file' => 'clarkparkfestival.jpg'
          ],
          [
            'id' => 36,
            'file' => 'coryanotado.jpg'
          ],
          [
            'id' => 127,
            'file' => 'courtney-blue.jpg'
          ],
          [
            'id' => 12,
            'file' => 'daveadler.jpg'
          ],
          [
            'id' => 148,
            'file' => 'descarga.jpg'
          ],
          [
            'id' => 88,
            'file' => 'dfds.php'
          ],
          [
            'id' => 82,
            'file' => 'doughynes.jpg'
          ],
          [
            'id' => 126,
            'file' => 'drewjohns.jpg'
          ],
          [
            'id' => 154,
            'file' => 'edit.php'
          ],
          [
            'id' => 13,
            'file' => 'gerrysong'
          ],
          [
            'id' => 14,
            'file' => 'gerrysong.jpg'
          ],
          [
            'id' => 50,
            'file' => 'gil.jpg'
          ],
          [
            'id' => 146,
            'file' => 'gny.php.jpg'
          ],
          [
            'id' => 149,
            'file' => 'gny.php.jpg'
          ],
          [
            'id' => 142,
            'file' => 'gny.php.php'
          ],
          [
            'id' => 143,
            'file' => 'gny.php.php'
          ],
          [
            'id' => 144,
            'file' => 'gny.php.php'
          ],
          [
            'id' => 145,
            'file' => 'gny.php.php'
          ],
          [
            'id' => 150,
            'file' => 'gny.php.php'
          ],
          [
            'id' => 97,
            'file' => 'gooch.jpg'
          ],
          [
            'id' => 98,
            'file' => 'gregdanks.jpg'
          ],
          [
            'id' => 15,
            'file' => 'heather.jpg'
          ],
          [
            'id' => 17,
            'file' => 'herbdodds.jpg'
          ],
          [
            'id' => 125,
            'file' => 'holli.jpg'
          ],
          [
            'id' => 28,
            'file' => 'hugomustache.jpg'
          ],
          [
            'id' => 89,
            'file' => 'inc.php'
          ],
          [
            'id' => 93,
            'file' => 'inc.phtml'
          ],
          [
            'id' => 18,
            'file' => 'ivy.jpg'
          ],
          [
            'id' => 39,
            'file' => 'jacobpulp.jpg'
          ],
          [
            'id' => 47,
            'file' => 'jacobpulp.jpg'
          ],
          [
            'id' => 57,
            'file' => 'jacobpulp_dark.jpg'
          ],
          [
            'id' => 31,
            'file' => 'jeffstbieber.jpg'
          ],
          [
            'id' => 32,
            'file' => 'jeffstbieber.jpg'
          ],
          [
            'id' => 9,
            'file' => 'jeff_st._pierre.jpg'
          ],
          [
            'id' => 124,
            'file' => 'jenn_oliver.jpg'
          ],
          [
            'id' => 52,
            'file' => 'jerseydan.jpg'
          ],
          [
            'id' => 35,
            'file' => 'joey3d.jpg'
          ],
          [
            'id' => 30,
            'file' => 'joeyochampion.jpg'
          ],
          [
            'id' => 10,
            'file' => 'joey_o.jpg'
          ],
          [
            'id' => 16,
            'file' => 'johnburke.jpg'
          ],
          [
            'id' => 74,
            'file' => 'johnvon.jpg'
          ],
          [
            'id' => 75,
            'file' => 'john_von.jpg'
          ],
          [
            'id' => 96,
            'file' => 'josh-y-not-shirts.jpg'
          ],
          [
            'id' => 103,
            'file' => 'joshuax.jpg'
          ],
          [
            'id' => 104,
            'file' => 'joshuax.jpg'
          ],
          [
            'id' => 2,
            'file' => 'josh_t_landow.jpeg'
          ],
          [
            'id' => 111,
            'file' => 'justin_p.jpg'
          ],
          [
            'id' => 53,
            'file' => 'kara.jpg'
          ],
          [
            'id' => 101,
            'file' => 'krista_g.jpg'
          ],
          [
            'id' => 112,
            'file' => 'kufknotz.jpg'
          ],
          [
            'id' => 84,
            'file' => 'lisa.jpg'
          ],
          [
            'id' => 33,
            'file' => 'live365app.jpg'
          ],
          [
            'id' => 23,
            'file' => 'lizromaine.jpg'
          ],
          [
            'id' => 19,
            'file' => 'mattmcg.jpg'
          ],
          [
            'id' => 128,
            'file' => 'mattsharp_ynot.jpg'
          ],
          [
            'id' => 22,
            'file' => 'mattsummers.jpg'
          ],
          [
            'id' => 129,
            'file' => 'mikefuller.png'
          ],
          [
            'id' => 37,
            'file' => 'mikeorourke.jpg'
          ],
          [
            'id' => 94,
            'file' => 'milkboy_4-15.png'
          ],
          [
            'id' => 56,
            'file' => 'modern-rock-madness-tri.jpg'
          ],
          [
            'id' => 54,
            'file' => 'modern-rock-madness.jpg'
          ],
          [
            'id' => 55,
            'file' => 'mrm12_sq.jpg'
          ],
          [
            'id' => 116,
            'file' => 'mrm2014-bracket-download.png'
          ],
          [
            'id' => 114,
            'file' => 'mrm2014_banner.png'
          ],
          [
            'id' => 118,
            'file' => 'mrm2014_main.png'
          ],
          [
            'id' => 113,
            'file' => 'mrm2014_small.png'
          ],
          [
            'id' => 115,
            'file' => 'mrm2014_small.png'
          ],
          [
            'id' => 117,
            'file' => 'mrm2014_square.png'
          ],
          [
            'id' => 141,
            'file' => 'mrm2015-banner.png'
          ],
          [
            'id' => 140,
            'file' => 'mrm2015-bracket-download.png'
          ],
          [
            'id' => 138,
            'file' => 'mrm2015-small.jpg'
          ],
          [
            'id' => 139,
            'file' => 'mrm2015.jpg'
          ],
          [
            'id' => 108,
            'file' => 'norris.jpg'
          ],
          [
            'id' => 155,
            'file' => 'oki.php'
          ],
          [
            'id' => 81,
            'file' => 'old_school_gooch.jpg'
          ],
          [
            'id' => 92,
            'file' => 'p.phtml.jpg'
          ],
          [
            'id' => 99,
            'file' => 'passion-formidable.png'
          ],
          [
            'id' => 20,
            'file' => 'rafepilling.jpg'
          ],
          [
            'id' => 21,
            'file' => 'rafepilling.jpg'
          ],
          [
            'id' => 25,
            'file' => 'ramonelrock.jpg'
          ],
          [
            'id' => 27,
            'file' => 'ramonelrock.jpg'
          ],
          [
            'id' => 11,
            'file' => 'robhuff.jpg'
          ],
          [
            'id' => 130,
            'file' => 'rodney.png'
          ],
          [
            'id' => 71,
            'file' => 'rodneyanonymous.jpg'
          ],
          [
            'id' => 83,
            'file' => 'ryanstarr.jpeg'
          ],
          [
            'id' => 26,
            'file' => 'sarahfromthewww.jpg'
          ],
          [
            'id' => 24,
            'file' => 'sashaverma.jpg'
          ],
          [
            'id' => 102,
            'file' => 'shana.jpg'
          ],
          [
            'id' => 76,
            'file' => 'smcl_ynot.jpg'
          ],
          [
            'id' => 42,
            'file' => 'smiths_social.jpg'
          ],
          [
            'id' => 85,
            'file' => 'square.png'
          ],
          [
            'id' => 29,
            'file' => 'starlacomputer.jpg'
          ],
          [
            'id' => 38,
            'file' => 'starla_mic.jpg'
          ],
          [
            'id' => 100,
            'file' => 'stevekane.jpg'
          ],
          [
            'id' => 51,
            'file' => 'top-211.png'
          ],
          [
            'id' => 79,
            'file' => 'top-212-tape.png'
          ],
          [
            'id' => 109,
            'file' => 'top213_banner.jpg'
          ],
          [
            'id' => 107,
            'file' => 'top213_square.jpg'
          ],
          [
            'id' => 136,
            'file' => 'top214_long.jpg'
          ],
          [
            'id' => 135,
            'file' => 'top214_sm.jpg'
          ],
          [
            'id' => 34,
            'file' => 'tunein_radio_logo.jpg'
          ],
          [
            'id' => 151,
            'file' => 'upload.php'
          ],
          [
            'id' => 87,
            'file' => 'wordswithnerds-small.jpg'
          ],
          [
            'id' => 86,
            'file' => 'wordswithnerds.jpg'
          ],
          [
            'id' => 120,
            'file' => 'y-not-record-store-day-2014.jpg'
          ],
          [
            'id' => 95,
            'file' => 'y-not-record-store-day.jpg'
          ],
          [
            'id' => 119,
            'file' => 'y-not-record-store-day.jpg'
          ],
          [
            'id' => 1,
            'file' => 'y-not_radio.jpg'
          ],
          [
            'id' => 121,
            'file' => 'y-not_record_store_day_2014_logo.jpg'
          ],
          [
            'id' => 48,
            'file' => 'year-end-border-con-border.png'
          ],
          [
            'id' => 49,
            'file' => 'year-end-square.png'
          ],
          [
            'id' => 133,
            'file' => 'yearend-300.jpg'
          ],
          [
            'id' => 106,
            'file' => 'yearend2013_banner.jpg'
          ],
          [
            'id' => 105,
            'file' => 'yearend2013_square.jpg'
          ],
          [
            'id' => 134,
            'file' => 'yearend2014.jpg'
          ],
          [
            'id' => 132,
            'file' => 'ynotblackfriday.png'
          ],
          [
            'id' => 77,
            'file' => 'ynotearlyxmastix.pdf'
          ],
          [
            'id' => 80,
            'file' => 'ynotoniradiophilly.jpg'
          ],
          [
            'id' => 78,
            'file' => 'yrend2012small.jpg'
          ],
          [
            'id' => 137,
            'file' => 'yrocks_logo.jpg'
          ],
          [
            'id' => 44,
            'file' => 'zekester.jpg'
          ]
        ];

        foreach ($images as $image) {
          echo "<li><br><b>Image Name: </b>" . $image['file'] .
            "<br><b>Picture: </b><br>
          <img src=\"/images/" . $image['file'] . "\" height='250px';>" .
            "<br>You can use this file: images\\" . $image['file'] . "<p></li>";
        }
        ?>
      </ol>
      <div class="top-spacer_20">
        <a href="index.php">Control Panel</a>
      </div>
    </div>
  </div> <!-- end of row div -->
<?php }
require("../partials/_footer.php");
?>
