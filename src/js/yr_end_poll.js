function init(){
	enableSubmit();
	otherWatcher();
}

function enableSubmit(){
	var max = $('#max_pick').html();
	$('input[type="checkbox"]').change(function() {
		var numberOfChecked = $("input[type=checkbox]:checked").length
		if ( numberOfChecked > 0 && numberOfChecked <= max){
			$('#submit_votes').attr('disabled', false);
			$('#error_message').hide();
		} else {
			$('#error_message').html(errorMessage(numberOfChecked, max));
			$('#error_message').show();
			$('#submit_votes').attr('disabled', true);
		}
	});
}

function errorMessage(numberOfChecked, max){
	if (numberOfChecked === 0) {
		return "You need to select at least one option above.";
	}
	
	if (numberOfChecked > max) {
		return "You have selected too many.";
	}
}

function otherWatcher(){
	$('#write_in').change(function(){
		if ( $('#write_in').is(":checked") ) {
			$('#write_in_value').attr('disabled', false);
		} else {
			$('#write_in_value').val("");
			$('#write_in_value').attr('disabled', true);
		}
	});
}