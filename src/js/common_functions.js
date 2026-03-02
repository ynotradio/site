// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-2140137-3']);
_gaq.push(['_trackPageview']);

(function () {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// ymail.php specific functions
function setDays() {
  if (typeof document.getElementById("send_date_month") === 'undefined' ||
    document.getElementById("send_date_month") === null) {
    return; // Not on ymail page, skip this function
  }

  var m = document.getElementById("send_date_month").value;
  m = parseInt(m, 10);
  var y = document.getElementById("send_date_year").value;
  var monthStartDate = new Date(y, m - 1, 1);
  var monthEndDate = (new Date(y, m, 1).getTime()) - 86400; //(1000 * 60 * 60 *24);
  var d = new Date(monthEndDate);
  var maxD = d.getDate();

  var lst = document.getElementById("send_date_day");
  lst.options.length = 0;

  for (var i = 1; i <= maxD; i++) {
    lst.options[lst.options.length] = new Option(i, i);
  }
}
function checkForm() {
  var obj = document.getElementById("birthday");
  obj.value = document.getElementById("send_date_year").value + "-" +
    document.getElementById("send_date_month").value + "-" +
    document.getElementById("send_date_day").value;

  return true;
}

$('#top11_write_in').live('click', function () {
  if ($('#top11_write_in:checked').length == 0) {
    $('#write_in_value').attr('disabled', true);
    $('#write_in_value').val('');
  } else {
    $('#write_in_value').attr('disabled', false);
  }
});

