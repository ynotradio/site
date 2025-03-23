<?php

$page_file = "contact.php";
$page_title = "Contact Us";

require ("functions/main_fns.php");
require ("partials/_header.php");

$action = "fill_out";
if ($_POST['action'])
    $action = $_POST['action'];

/*----- CONTENT ------*/
?>
<div class="row">
    <div class="nine columns content">
        <h1>Drop us a line!</h1>
        <?php if ($action == "fill_out") {
            $ipi = getenv("REMOTE_ADDR");
            $httprefi = getenv ("HTTP_REFERER");
            $httpagenti = getenv ("HTTP_USER_AGENT");
            ?>
            <form method="post" action="contact.php" class="form-default inline input-seperation" id="contact_us">
                <fieldset>
                    <div class="control-group">
                        <label class="required">Your Name</label>
                        <div class="controls"><input type="text" name="visitor" class="input-l"/></div>
                        <label class="required">Your Email</label>
                        <div class="controls"><input type="text" name="visitormail" class="input-l"/></div>
                        <label class="required">Attention</label>
                        <div class="controls"><select name="attention">
                                <option value=""> Select a contact. . . </option>
                                <option value="1"> Programming </option>
                                <option value="2"> Local Music Submissions </option>
                                <option value="3"> Advertising/Sponsorships </option>
                                <option value="4"> Website Issues </option>
                            </select></div>
                        <label class="multiline required">Message</label>
                        <div class="controls"><textarea name="notes" rows="4" class="input-l"></textarea></div>
                    </div>
                    <div class="form-actions">
                        <input type="hidden" name="ip" value="<?php echo $ipi ?>"/>
                        <input type="hidden" name="httpref" value="<?php echo $httprefi ?>"/>
                        <input type="hidden" name="httpagent" value="<?php echo $httpagenti ?>"/>
                        <input type="hidden" name="action" value="send_mail"/>
                        <button class="btn-info" type="submit">Send Message</button>
                    </div>
                </fieldset>
            </form>
        <?php } else {
            require ("partials/_sendmail.php");
        } ?>
        <div class="center top-spacer_20">To make a request e-mail the <a href="/deejays">DJ</a> currently on air or text to 707-800-YNOT (9668).</div>
    </div>
    <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>

