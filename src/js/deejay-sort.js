$(document).ready(function () {

	$('.sortable').sortable({
		handle: ".handle",
		items: ".sort-item",
		update: function (event, ui) {
			var data = $(this).sortable('serialize');
			// POST to server using $.post or $.ajax
			$.ajax({
				data: data,
				type: 'POST',
				url: '/cp/api/deejay_sort.php',
				success: function (data) {
				}
			});
		}
	});
});