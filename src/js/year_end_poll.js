function init(){
	enableSubmit();
	otherWatcher();
  flashRemover();
  enterToWinWatcher();
}

function enableSubmit() {
	var max = $('#max_pick').html();
	$('input[type="checkbox"]').change(function() {
		var numberOfChecked = $("input[type=checkbox]:checked").length;
		if (numberOfChecked == max){
      $('#vote').text('Vote now!');
      $('#vote').removeClass('disabled');
			$('#vote').attr('disabled', false);
    } else if (numberOfChecked > max) {
      $('#vote').text("You've picked too many.");
      $('#vote').addClass('disabled');
			$('#vote').attr('disabled', true);
		} else {
      $('#vote').text('Pick ' + (max - numberOfChecked) + " more!");
      $('#vote').addClass('disabled');
			$('#vote').attr('disabled', true);
		}
	});
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
