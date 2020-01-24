<?php

$page_file = "yearendpollresults.php";
$page_title = "Year End Poll Results";

require ("ext/main_fns.php");
require ("ext/header.php");
open_db();
$page = "1";
	if ($_GET['page'] != '') {
		$page = $_GET['page'];
	}
/*----- CONTENT ------*/
?>

<div id="survey">
<center>
<img src="images\yrendlong2012.png" alt="" width="800px"></center>
<p><div id="survey_text" style="padding: 0 25px">
Thanks to everyone who voted in the 2012 Year End Poll! If you missed any of results during our Top 212 Songs of 2012 Countdown here they are. And congratulations to Tessa Powell, our grand prize winner of a $100 iTunes gift card and the chance to host her own Top 20 of 2012 on Y-Not Radio! Check out the Y-Not DJs' Best of Lists <a href="yearendstaff.php">here</a>.
</div>
<center>
<a href="https://twitter.com/share" class="twitter-share-button" data-text="Check out @YNotRadio's Year End Poll and you could win a $100 iTunes gift card" data-count="none" data-via="YNotRadio">Tweet</a><script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
<div class="fb-like" data-href="http://www.ynotradio.net/yearendpollresults.php" data-send="true" data-width="450" data-show-faces="false"></div>
</center>
<div id="tops">
<?php
if ($page == 1){
?>
<h3>Top 212 of 2012</h3>
	<ol>
		<li value="212">Tenacious D - Rize Of The Fenix</li>
		<li value="211">Young Hines - Rainy Day</li>
		<li value="210">Dick Valentine - Destroy The Children</li>
		<li value="209">Chappo - Come Home</li>
		<li value="208">The Big Pink - Rubbernecking</li>
		<li value="207">Eternal Summers - You Kill</li>
		<li value="206">Screaming Females - It All Means Nothing</li>
		<li value="205">Blood Red Shoes - In Time To Voices</li>
		<li value="204">Corin Tucker Band - Groundhog Day</li>
		<li value="203">Kitten - Cut It Out</li>
		<li value="202">Sleeper Agent - Get Burned</li>
		<li value="201">The Soft Pack - Saratoga</li>
		<li value="200">The Spinto Band - Take It</li>
		<li value="199">Imperial Teen - Runaway</li>
		<li value="198">mewithoutyou - Cardiff Giant</li>
		<li value="197">The Cribs - Come On, Be A No One</li>
		<li value="196">A Place To Bury Strangers - And I'm Up</li>
		<li value="195">Jeff The Brotherhood - Sixpack</li>
		<li value="194">Minature Tigers - Boomerang</li>
		<li value="193">First Aid Kit - The Lion's Roar</li>
		<li value="192">The Chevin - Champion</li>
		<li value="191">Hop Along - Tibetan Pop Stars</li>
		<li value="190">Saint Motel - Puzzle Pieces</li>
		<li value="189">Miike Snow - Devil's Work</li>
		<li value="188">Savoir Adore - Dreamers</li>
		<li value="187">Amanda Palmer & The Grand Theft Orchestra - The Killing Type</li>
		<li value="186">Dandy Warhols - Sad Vaction</li>
		<li value="185">Maximo Park - Hips And Lips</li>
		<li value="184">Matt and Kim - NOW</li>
		<li value="183">Paul Banks - The Base</li>
		<li value="182">Summer Camp - Better Off Without You</li>
		<li value="181">Garbage - Automatic Systematic Habit</li>
		<li value="180">Stephie Coplan & The Pedestrians - Caroline</li>
		<li value="179">Placebo - B3</li>
		<li value="178">Jukebox The Ghost - Oh, Emily</li>
		<li value="177">Metric - Speed The Collapse</li>
		<li value="176">Sleigh Bells - Born To Lose</li>
		<li value="175">Walk The Moon - Tightrope</li>
		<li value="174">Brendan Benson - What Kind Of World</li>
		<li value="173">IAMDYNAMITE - Stereo</li>
		<li value="172">Atoms For Peace - Default</li>
		<li value="171">Diamond Rings - I'm Just Me</li>
		<li value="170">Tennis - Origins</li>
		<li value="169">The Mynabirds - Generals</li>
		<li value="168">The Spinto Band - The Living Things</li>
		<li value="167">Ben Kweller - Mean To Me</li>
		<li value="166">Royal Teeth - Wild</li>
		<li value="165">The Vaccines - No Hope</li>
		<li value="164">Of Montreal - Dour Percentage</li>
		<li value="163">School of Seven Bells - The Night</li>
		<li value="162">Ra Ra Riot - Beta Love</li>
		<li value="161">The Asteroids Galaxy Tour - Heart Attack</li>
		<li value="160">Twin Shadow - Beg For The Night</li>
		<li value="159">Pinback - Proceed To Memory</li>
		<li value="158">I Was Totally Destroying It - My Internal Din</li>
		<li value="157">Guided By Voices - Class Clown Spots A UFO</li>
		<li value="156">Mark Foster + Kimbra + A-Trak - Warrior</li>
		<li value="155">The Kooks - How'd You Like That</li>
		<li value="154">The Helio Sequence - October</li>
		<li value="153">Soundgarden - Live To Rise</li>
		<li value="152">Muse - Survival</li>
		<li value="151">Freelance Whales - Spitting Image</li>
		<li value="150">King Tuff - Bad Thing</li>
		<li value="149">Jens Lekman - I Know What Love Isn't</li>
		<li value="148">Turning violet Violet - Cold Bread</li>
		<li value="147">Best Coast - Why I Cry</li>
		<li value="146">The Vaccines - Teenage Icon</li>
		<li value="145">Class Actress - Weekend</li>
		<li value="144">Green Day - Oh Love</li>
		<li value="143">Dirty Projectors - About To Die</li>
		<li value="142">A.C. Newman f/ Neko Case - Encyclopedia of Classic Takedowns</li>
		<li value="141">White Rabbits - Temporary</li>
		<li value="140">Silversun Pickups - Mean Spirits</li>
		<li value="139">Frightened Rabbit - State Hospital</li>
		<li value="138">Nada Surf - Looking Through</li>
		<li value="137">The Drums - Days</li>
		<li value="136">Bloc Party - Kettling</li>
		<li value="135">Amanda Palmer & The Grand Theft Orchestra - Want It Back</li>
		<li value="134">Jukebox The Ghost - Ghosts In Empty Houses</li>
		<li value="133">Arcade Fire - Abraham's Daughter</li>
		<li value="132">Ladyhawke - Black, White & Blue</li>
		<li value="131">The Whigs - Waiting</li>
		<li value="130">Andrew Bird - Eyeoneye</li>
		<li value="129">Sea Wolf - Old Friend</li>
		<li value="128">Hot Chip - Don't Deny Your Heart</li>
		<li value="127">Ben Folds Five - Michael Praytor, Five Years Later</li>
		<li value="126">Dinosaur Jr. - Watch The Corners</li>
		<li value="125">Sleigh Bells - Demons</li>
		<li value="124">Coldplay - Charlie Brown</li>
		<li value="123">Cold War Kids - Minimum Day</li>
		<li value="122">The Heavy - What Makes A Good Man?</li>
		<li value="121">Now, Now - Thread</li>
		<li value="120">The Dead Milkmen - Fauxhemia</li>
		<li value="119">Cheers Elephant - Leaves</li>
		<li value="118">Dirty Ghosts - Ropes That Way</li>
		<li value="117">The Gaslight Anthem - Here Comes My Man</li>
		<li value="116">The Hives - Wait A Minute</li>
		<li value="115">Divine Fits - My Love Is Real</li>
		<li value="114">Free Energy - Dance All Night</li>
		<li value="113">Benjamin Gibbard - Teardrop Windows</li>
		<li value="112">Smashing Pumpkins - The Chimera</li>
		<li value="111">Noel Gallagher's High Flying Birds - AKA...What A Life</li>
		<li value="110">Islands - Hallways</li>
		<li value="109">Muse - Follow Me</li>
		<li value="108">The Shins - The Rifle's Spiral</li>
		<li value="107">Regina Spektor - All The Rowboats</li>
		<li value="106">Animal Collective - Today's Supernatural</li>
		<li value="105">Stars - Theory Of Relativity</li>
		<li value="104">Yeasayer - Longevity</li>
		<li value="103">The Joy Formidable - This Ladder Is Ours</li>
		<li value="102">Lana Del Rey - Born To Die</li>
		<li value="101">Sun Airway - Close</li>
		<li value="100">Divine Fits - Would That Not Be Nice</li>
		<li value="99">Jack White - Freedom At 21</li>
		<li value="98">Santigold - Big Mouth</li>
		<li value="97">Band of Skulls - Sweet Sour</li>
		<li value="96">The Magnetic Fields - Andrew In Drag</li>
		<li value="95">Phantogram - Make A Fist</li>
		<li value="94">Garbage - Control</li>
		<li value="93">The Raveonettes - She Owns The Streets</li>
		<li value="92">Delta Spirit - Tear It Up</li>
		<li value="91">Blur - The Puritan</li>
		<li value="90">David Byrne & St. Vincent - Lazurus</li>
		<li value="89">Bat For Lashes - All Your Gold</li>
		<li value="88">Kaiser Chiefs - On The Run</li>
		<li value="87">Band Of Horses - Knock Knock</li>
		<li value="86">Dum Dum Girls - Lord Knows</li>
		<li value="85">Poliça - Dark Star</li>
		<li value="84">Ben Folds Five - Draw A Crowd</li>
		<li value="83">Beach House - Lazuli</li>
		<li value="82">The Gaslight Anthem - Handwritten</li>
		<li value="81">Stephie Coplan & The Pedestrians - JERK!</li>
		<li value="80">Bob Mould - The Descent</li>
		<li value="79">Japandroids - The Nights Of Wine And Roses</li>
		<li value="78">M.I.A. - Bad Girls</li>
		<li value="77">Yeasayer - Henrietta</li>
		<li value="76">Titus Andronicus - In A Big City</li>
		<li value="75">Chairlift - Amanaemonesia</li>
		<li value="74">Cat Power - Ruin</li>
		<li value="73">The Ting Tings - Hang It Up</li>
		<li value="72">Passion Pit - I'll Be Alright</li>
		<li value="71">Trent Reznor & Atticus Ross f/Karen O - Immigrant Song</li>
		<li value="70">The Shins - It's Only Life</li>
      <li value="69">Stars - Hold On When You Get Love And Let Go When You Give It</li>
      <li value="68">Jack White - I'm Shakin'</li>
      <li value="67">Free Energy - Electric Fever</li>
      <li value="66">Fiona Apple - Anything We Want</li>
      <li value="65">Jukebox The Ghost - Somebody</li>
      <li value="64">Arctic Monkeys - R U Mine</li>
      <li value="63">The Hives - Go Right Ahead</li>
      <li value="62">The Killers - Runaways</li>
      <li value="61">Atlas Genius - Trojans</li>
      <li value="60">Dr. Dog - Lonesome</li>
      <li value="59">M83 - OK Pal</li>
      <li value="58">Garbage - Blood For Poppies</li>
      <li value="57">Hot Chip - Night & Day</li>
      <li value="56">Cat Power - Cherokee</li>
      <li value="55">Beach House - Other People</li>
      <li value="54">Tame Impala - Elephant</li>
      <li value="53">Santigold - The Keepers</li>
      <li value="52">Cheers Elephant - Doin' It, Right</li>
      <li value="51">Bloc Party - Octopus</li>
      <li value="50">Alt-J - Fitzpleasure</li>
      <li value="49">Passion Pit - Carried Away</li>
      <li value="48">Miike Snow - Paddling Out</li>
      <li value="47">Silversun Pickups - The Pit</li>
      <li value="46">The Walkmen - Heaven</li>
      <li value="45">Dirty Projectors - Gun Has No Trigger</li>
      <li value="44">Nada Surf - Waiting For Something</li>
      <li value="43">Real Estate - Easy</li>
      <li value="42">Walk The Moon - Anna Sun</li>
      <li value="41">Fiona Apple - Every Single Night</li>
      <li value="40">Gorillaz f/ Andre 3000 and James Murphy - DoYaThing</li>
      <li value="39">Florence + The Machine - Lover To Lover</li>
      <li value="38">Father John Misty - Hollywood Forever Cemetery Sings</li>
      <li value="37">Jack White - Love Interruption</li>
      <li value="36">Django Django - Default</li>
      <li value="35">Wilco - Dawned On Me</li>
      <li value="34">Twin Shadow - Five Seconds</li>
      <li value="33">Cloud Nothings - Stay Useless</li>
      <li value="32">fun. - We Are Young</li>
      <li value="31">Two Door Cinema Club - Sleep Alone</li>
      <li value="30">Radiohead - Staircase</li>
      <li value="29">Grizzly Bear - Yet Again</li>
      <li value="28">Dr. Dog - Be The Void</li>
      <li value="27">Silversun Pickups - Bloody Mary (Nerve Endings)</li>
      <li value="26">Metric - Youth Without Youth</li>
      <li value="25">Amanda Palmer & The Grand Theft Orchestra - Do It With A Rock Star</li>
      <li value="24">David Byrne & St. Vincent - Who</li>
      <li value="23">Delta Spirit - California</li>
      <li value="22">Matt and Kim - Let's Go</li>
      <li value="21">Tegan and Sara - Closer</li>
      <li value="20">Santigold - Disparate Youth</li>
      <li value="19">Beach House - Myth</li>
      <li value="18">Ben Folds Five - Do It Anyway</li>
      <li value="17">Grouplove - Tongue Tied</li>
      <li value="16">Sleigh Bells - Comeback Kid</li>
      <li value="15">Jack White - Sixteen Saltines</li>
      <li value="14">fun. - Some Nights</li>
      <li value="13">The Gaslight Anthem - 45</li>
      <li value="12">The Black Keys - Little Black Submarines</li>
      <li value="11">Mumford & Sons - I Will Wait</li>
      <li value="10">Muse - Madness</li>
      <li value="9">Best Coast - The Only Place</li>
      <li value="8">The xx  - Chained</li>
      <li value="7">Japandroids - The House That Heaven Built</li>
      <li value="6">M83 - Reunion</li>
      <li value="5">Metric - Breathing Underwater</li>
      <li value="4">Dr. Dog - That Old Black Hole</li>
      <li value="3">The Shins - Simple Song</li>
      <li value="2">The Black Keys - Gold On The Ceiling</li>
      <li value="1">Passion Pit - Take A Walk</li>
	</ol>
<p>
	Check out <a href="yearendpollresults.php?page=2">more results</a>
  <?php
    } elseif ($page == 2) {
  ?>
    <h3>Top 20 Albums of 2012</h3>
    <ol>
        <li value="1">Jack White	 - Blunderbuss</li>
        <li value="2">Mumford & Sons - Babel</li>
        <li value="3">The xx - Coexist</li>
        <li value="4">Metric - Synthetica</li>
        <li value="5">Passion Pit - Gossamer</li>
        <li value="6">Dr. Dog - Be The Void</li>
        <li value="7">The Shins - Port Of Morrow</li>
        <li value="8">Japandroids - Celebration Rock</li>
        <li value="9">David Byrne & St. Vincent - Love This Giant</li>
        <li value="10">Beach House - Bloom</li>
        <li value="11">Silversun Pickups - Neck Of The Woods</li>
        <li value="12">fun. - Some Nights</li>
        <li value="13">Santigold - Master Of My Make Believe</li>
        <li value="14">The Gaslight Anthem - Handwritten</li>
        <li value="15">Fiona Apple - The Idler Wheel...</li>
        <li value="16">Grizzly Bear - Shields</li>
        <li value="17">Ben Folds Five - The Sound Of The Life Of The Mind</li>
        <li value="18">Muse - The 2nd Law</li>
        <li value="19">Two Door Cinema Club - Beacon</li>
        <li value="20">Cat Power - Sun</li>
    </ol>
    <h3>Top 10 Artists of 2012</h3>
    <ol>
        <li value="1">The Black Keys</li>
        <li value="2">Jack White</li>
        <li value="3">Dr. Dog</li>
        <li value="3">Mumford & Sons</li>
        <li value="5">Metric</li>
        <li value="6">Passion Pit</li>
        <li value="7">M83</li>
        <li value="7">The Gaslight Anthem</li>
        <li value="9">Japandroids</li>
        <li value="10">Ben Folds Five</li>
        <li value="10">David Byrne & St. Vincent</li>
        <li value="10">fun.</li>
        <li value="10">Radiohead</li>
        <li value="10">The Shins</li>
    </ol>

    <h3>Top 10 New Artists of 2012</h3>
    <ol>
        <li value="1">Django Django</li>
        <li value="1">Divine Fits</li>
        <li value="3">Father John Misty</li>
        <li value="4">Cloud Nothings</li>
        <li value="5">Alt-J</li>
        <li value="6">Walk The Moon</li>
        <li value="6">Poliça</li>
        <li value="8">Dirty Ghosts</li>
        <li value="9">Stephie Coplan & The Pedestrians</li>
        <li value="10">IAMDYNAMITE</li>
        <li value="10">Animal Kingdom</li>
 
      </ol>
    <h3>Top 5 Music Videos of 2012</h3>
    <ol>
        <li value="1">The Black Keys - Gold On The Ceiling</li>
        <li value="2">M.I.A. - Bad Girls</li>
        <li value="3">Passion Pit - Take A Walk</li>
        <li value="4">Ben Folds Five - Do It Anyway</li>
        <li value="5">Matt and Kim - Let's Go</li>
        <li value="5">Fiona Apple - Every Single Night</li>
        <li value="5">Amanda Palmer & The Grand Theft Orchestra - Do It With A Rock Star</li>
        <li value="5">The Shins - Simple Song</li>
    </ol>
    <h3>Top 5 Most Anticipated New Albums of 2012</h3>
    <ol>
        <li value="1">The Black Keys</li>
        <li value="2">The Strokes</li>
        <li value="3">Tegan and Sara</li>
        <li value="4">Yeah Yeah Yeahs</li>
        <li value="5">Beck</li>
    </ol>
    <h3>Top 10 Favorite Concerts of 2012</h3>
    <ol>
        <li value="1">M83 @ Electric Factory</li>
        <li value="2">The Black Keys w/Arctic Monkeys @ Wells Fargo Center</li>
        <li value="3">Radiohead @ Susquehanna Bank Center</li>
        <li value="4">Ben Folds Five @ Tower Theatre</li>
        <li value="5">Metric @ Tower Theatre</li>
        <li value="6">The Gaslight Anthem @ Electric Factory</li>
        <li value="7">Coldplay @ Wells Fargo Center</li>
        <li value="7">Dr. Dog @ Electric Factory</li>
        <li value="9">Beach House @ Union Transfer</li>
        <li value="10">Passion Pit w/Ra Ra Riot @ Electric Factory</li>
        <li value="10">Foster The People w/Toyko Police Club @ Mann Center</li>
    </ol>
      <h3>Top 10 Y-Not Philly Artists of 2012</h3>
    <ol>
        <li value="1">Dr. Dog</li>
        <li value="2">The War On Drugs</li>
        <li value="3">The Dead Milkmen</li>
        <li value="4">Free Energy</li>
        <li value="5">Teeel</li>
        <li value="6">Cheers Elephant</li>
        <li value="7">The Spinto Band</li>
        <li value="8">Sun Airway</li>
        <li value="9">Turning violet Violet</li>
        <li value="10">Creepoid</li>
        <li value="10">Mewithoutyou</li>
      </ol>
    <p>
    <a href="yearendpollresults.php?page1"><< Top 211 of 2012</a> | <a href="yearendpollresults.php?page=3">More results >></a>
    <?php
    } else {
    ?>
    <h3>Top 10 Movies of 2012</h3>
    <ol>
        <li value="1">The Dark Knight Rises</li>
        <li value="2">Moonrise Kingdom</li>
        <li value="3">The Avengers</li>
        <li value="4">The Hunger Games</li>
        <li value="5">Lincoln</li>
        <li value="6">Skyfall</li>
        <li value="7">The Hobbit: An Unexpected Journey</li>
        <li value="8">Silver Linings Playbook</li>
        <li value="9">Ted </li>
        <li value="10">Argo</li>
    </ol>
      <h3>Top 10 Worst Movies of 2012</h3>
      <ol>
        <li value="1">The Twilight Saga: Breaking Dawn Part 2</li>
        <li value="2">Battleship</li>
        <li value="3">Madea's Witness Protection</li>
        <li value="4">Rock Of Ages</li>
        <li value="5">The Three Stooges</li>
        <li value="6">Piranha 3DD</li>
        <li value="6">Ghost Rider: Spirit Of Vengeance</li>
        <li value="8">What To Expect When You're Expecting</li>
        <li value="9">That's My Boy</li>
        <li value="10">Dark Shadows</li>
      </ol>
        <h3>Top 5 Most Unnecessary Sequels of 2012</h3>
      <ol>
          <li value="1">Men In Black 3</li>
          <li value="2">Amazing Spider-Man</li>
          <li value="2">The Twilight Saga: Breaking Dawn Part 2</li>
          <li value="2">Total Recall</li>
          <li value="5">Paranormal Activity 4</li>
        </ol>
      <h3>Top 5 TV Dramas of 2012</h3>
    <ol>
        <li value="1">The Walking Dead</li>
        <li value="2">Breaking Bad</li>
        <li value="3">Game Of Thrones</li>
        <li value="4">Boardwalk Empire</li>
        <li value="5">Dexter</li>
    </ol>
       <h3>Top 5 TV Comedies of 2012</h3>
    <ol>
        <li value="1">It's Always Sunny In Philadelphia</li>
        <li value="2">Parks & Recreation</li>
        <li value="3">Modern Family</li>
        <li value="4">30 Rock</li>
        <li value="5">Big Bang Theory</li>
    </ol>
      <h3>Top 5 Late Night Shows of 2012</h3>
      <ol>
          <li value="1">The Daily Show with Jon Stewart</li>
          <li value="2">The Colbert Report</li>
          <li value="3">Late Night with Jimmy Fallon</li>
          <li value="4">Conan</li>
          <li value="5">Saturday Night Live</li>
        </ol>
      <h3>Top 10 Saddest Celebrity Deaths of 2012</h3>
    <ol>
        <li value="1">Adam "MCA" Yauch</li>
        <li value="2">Whitney Houston</li>
        <li value="3">Neil Armstrong</li>
        <li value="4">Dick Clark</li>
        <li value="5">Davy Jones</li>
        <li value="5">Michael Clarke Duncan</li>
        <li value="7">Ray Bradbury</li>
        <li value="8">Levon Helm</li>
        <li value="9">Maurice Sendak</li>
        <li value="9">Joe Paterno</li>
    </ol>
    <h3>Top 5 Biggest Comebacks in 2012</h3>
    <ol>
        <li value="1">Ben Folds Five</li>
        <li value="2">The Shins</li>
        <li value="3">Fiona Apple</li>
        <li value="4">Garbage</li>
        <li value="5">Soundgarden</li>
    </ol>
    <p>
    <a href="yearendpollresults.php?page1"><< Top 211 of 2012</a>
<?php
}
?>
</div>
</div>
<div style="clear:both;"></div>
<?php require ("ext/footer.php"); ?>
