$(document).ready(function () {
	console.log("Deejay sort script loaded");

	$('.sortable').sortable({
		handle: ".handle",
		items: ".sort-item",
		update: function (event, ui) {
			// Serialize the sortable list
			var data = $(this).sortable('serialize');
			console.log("Sorted data:", data);
			
			// POST to server using $.post or $.ajax
			$.ajax({
				data: data,
				type: 'POST',
				url: '/cp/api/deejay_sort.php',
				success: function (response) {
					console.log("Sort update successful:", response);
					// Optional: Show a success message
					$('<div class="update-success">Order updated successfully</div>')
						.appendTo('.sortable')
						.fadeIn('fast')
						.delay(2000)
						.fadeOut('fast', function() { $(this).remove(); });
				},
				error: function(xhr, status, error) {
					console.error("Sort update failed:", status, error);
					console.error("Response:", xhr.responseText);
				}
			});
		}
	});
});