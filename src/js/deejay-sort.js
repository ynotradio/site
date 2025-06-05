// filepath: /workspaces/site/src/js/deejay-sort.js
$(document).ready(function () {
	$('.sortable').sortable({
		handle: ".handle",
		items: ".sort-item",
		update: function (event, ui) {
			// Serialize the sortable list
			var data = $(this).sortable('serialize');

			// POST to server using $.post or $.ajax
			$.ajax({
				data: data,
				type: 'POST',
				url: '/cp/api/deejay_sort.php',
				success: function (response) {
					// Optional: Show a success message
					$('<div class="update-success">Order updated successfully</div>')
						.appendTo('.sortable')
						.fadeIn('fast')
						.delay(2000)
						.fadeOut('fast', function () { $(this).remove(); });
				},
				error: function (xhr, status, error) {
					// Optionally show an error message to the user
					$('<div class="update-error">Failed to update order</div>')
						.appendTo('.sortable')
						.fadeIn('fast')
						.delay(2000)
						.fadeOut('fast', function () { $(this).remove(); });
				}
			});
		}
	});
});
