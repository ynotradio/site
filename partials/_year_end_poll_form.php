<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Name</label>
      <div class=\"control\">
      <input type=\"text\" id=\"name\" name=\"name\" class=\"input-l\" value=\"\">
      </div>
    </div>  
    <div class=\"control-group\">
      <label class=\"required\">Email Address</label>
      <div class=\"control\">
      <input type=\"text\" id=\"email\" name=\"email\" class=\"input-l\" value=\"\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Phone #</label>
      <div class=\"control\">
      <input type=\"text\" id=\"phone\" name=\"phone\" class=\"input-l\" value=\"\">
      </div>
    </div>        
    <div class=\"control-group\">
      <label class=\"required\">Home Town</label>
      <div class=\"control\">
      <input type=\"text\" id=\"hometown\" name=\"hometown\" class=\"input-l\" value=\"\">
      </div>
    </div>    
    <div class=\"control-group top-spacer_20\">
      <label>Enter the Year End Poll contest?</label>
      <div class=\"controls inline clearfix\">
        <label for=\"yes\">
          <input type=\"radio\" name=\"contest\" id=\"yes\" value=\"yes\" />Yes
        </label>
        <label for=\"no\"><input type=\"radio\" name=\"contest\" id=\"no\" value=\"no\" />No
        </label>
      </div>
      <label>Would you like to receive Y-Not Radio's weekly Y-Mail newsletter?</label>
      <div class=\"controls inline clearfix\">
        <label for=\"newsletter-yes\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-yes\" value=\"yes\" />Yes</label>
        <label for=\"newsletter-no\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-no\" value=\"no\" />No</label>
        <label for=\"newsletter-already\"><input type=\"radio\" name=\"newsletter\" id=\"newsletter-already\" value=\"already\" />I Already Receive It</label>
      </div>
    </div>
    <div class=\"form-actions\">
    <input type=\"hidden\" name=\"contest_form\" value=\"contest\">
    <input type=\"submit\" id=\"enter_to_win\" class=\"btn-info disabled\" disabled=\"disabled\" value=\"Enter to Win!\">
    </div>
  </fieldset>";
?>
