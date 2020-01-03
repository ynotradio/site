$(document).ready(function(){

	$('.sortable').sortable({
		handle: ".handle",
		items: ".sort-item",
		update: function (event, ui) {
		        var data = $(this).sortable('serialize');
		        // POST to server using $.post or $.ajax
		        $.ajax({
		            data: data,
		            type: 'POST',
		            url: '/functions/deejay_fns.php', 
		            success: function(data) {
		            }
		        });
		    }
	});
});