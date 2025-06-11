<?php

// This partial renders the contest entry form
?>

<fieldset>
  <div class="control-group">
    <label class="required">Name</label>
    <div class="control">
      <input type="text" id="name" name="name" class="input-l" value="">
    </div>
  </div>
  
  <div class="control-group">
    <label class="required">Email Address</label>
    <div class="control">
      <input type="text" id="email" name="email" class="input-l" value="">
    </div>
  </div>
  
  <div class="control-group">
    <label class="required">Phone #</label>
    <div class="control">
      <input type="text" id="phone" name="phone" class="input-l" value="">
    </div>
  </div>
  
  <div class="control-group">
    <label class="required">Home Town</label>
    <div class="control">
      <input type="text" id="hometown" name="hometown" class="input-l" value="">
    </div>
  </div>
  
  <div class="control-group top-spacer_20">
    <label>Enter the Year End Poll contest?</label>
    <div class="controls inline clearfix">
      <label for="yes">
        <input type="radio" name="contest" id="yes" value="yes" />Yes
      </label>
      <label for="no">
        <input type="radio" name="contest" id="no" value="no" />No
      </label>
    </div>
    
    <label>Would you like to receive Y-Not Radio's weekly Y-Mail newsletter?</label>
    <div class="controls inline clearfix">
      <label for="newsletter-yes">
        <input type="radio" name="newsletter" id="newsletter-yes" value="yes" />Yes
      </label>
      <label for="newsletter-no">
        <input type="radio" name="newsletter" id="newsletter-no" value="no" />No
      </label>
      <label for="newsletter-already">
        <input type="radio" name="newsletter" id="newsletter-already" value="already" />I Already Receive It
      </label>
    </div>
  </div>
  
  <div class="form-actions">
    <input type="hidden" name="contest_form" value="contest">
    <input type="submit" id="enter_to_win" class="btn-info disabled" disabled="disabled" value="Enter to Win!">
  </div>
</fieldset>

<script>
  // Client-side validation for the contest form
  document.addEventListener('DOMContentLoaded', function() {
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');
    const hometownField = document.getElementById('hometown');
    const contestOptions = document.querySelectorAll('input[name="contest"]');
    const newsletterOptions = document.querySelectorAll('input[name="newsletter"]');
    const submitButton = document.getElementById('enter_to_win');
    
    // Check if all required fields are filled
    function validateForm() {
      const hasName = nameField.value.trim() !== '';
      const hasEmail = emailField.value.trim() !== '';
      const hasPhone = phoneField.value.trim() !== '';
      const hasHometown = hometownField.value.trim() !== '';
      
      let hasContest = false;
      contestOptions.forEach(option => {
        if (option.checked) hasContest = true;
      });
      
      let hasNewsletter = false;
      newsletterOptions.forEach(option => {
        if (option.checked) hasNewsletter = true;
      });
      
      const isValid = hasName && hasEmail && hasPhone && hasHometown && hasContest && hasNewsletter;
      
      // Update button state
      submitButton.disabled = !isValid;
      if (isValid) {
        submitButton.classList.remove('disabled');
      } else {
        submitButton.classList.add('disabled');
      }
    }
    
    // Add event listeners to all form elements
    [nameField, emailField, phoneField, hometownField].forEach(field => {
      field.addEventListener('input', validateForm);
    });
    
    contestOptions.forEach(option => {
      option.addEventListener('change', validateForm);
    });
    
    newsletterOptions.forEach(option => {
      option.addEventListener('change', validateForm);
    });
    
    // Initial validation
    validateForm();
  });
</script>
