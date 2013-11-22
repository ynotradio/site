function init(){
	enableSubmit();
	otherWatcher();
  flashRemover();
  enterToWinWatcher();
}

function enableSubmit() {
	var max = $('#max_pick').html();
	$('input[type="checkbox"]').change(function() {
		var numberOfChecked = $("input[type=checkbox]:checked").length
		if ( numberOfChecked > 0 && numberOfChecked <= max){
			$('#vote').attr('disabled', false);
      $('#vote').removeClass('disabled');
			$('#error_message').fadeOut('fast');
		} else {
			$('#error_message').html(errorMessage(numberOfChecked, max));
			$('#error_message').fadeIn();
      $('#vote').addClass('disabled');
			$('#vote').attr('disabled', true);
		}
	});
}

function errorMessage(numberOfChecked, max) {
	if (numberOfChecked === 0) {
		return "You need to select at least one option above.";
	}
	
	if (numberOfChecked > max) {
		return "You have selected too many.";
	}
}

function otherWatcher() {
	$('#song_write_in').change(function(){
		if ( $('#song_write_in').is(":checked") )
			$('#write_in_value').attr('disabled', false);
		else {
			$('#write_in_value').val("");
			$('#write_in_value').attr('disabled', true);
		}
	});
}

function flashRemover() {
  $('#flash').delay(1500).fadeTo(2000, 0.0).slideUp(800);
}

function enterToWinWatcher() {
  var inputs ='#name,#email,#phone,#hometown';
  var radios = "input[name='contest'],input[name='newsletter']";

  $(inputs).keyup(function() {
    submitButtonLogic();
  })
  
  $(radios).change(function() {
    submitButtonLogic();
  })
}

function formValidator() {
  return $('#name').val() != "" && $('#email').val() != "" &&
    $('#phone').val() != "" && $('#hometown').val() != "" && 
    ($("input[name='contest']:checked").length > 0) &&
    ($("input[name='newsletter']:checked").length > 0);
}

function submitButtonLogic() {
  var submitButton = $('#enter_to_win');

  if (formValidator()) {
    $(submitButton).removeAttr('disabled');
    $(submitButton).removeClass('disabled');
  } else {
    $(submitButton).attr("disabled","disabled")
    $(submitButton).addClass('disabled');
  }
}
