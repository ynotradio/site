<?php

$page_file = "ymail.php";
$page_title = "Y-Mail";

require ("functions/main_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Y-Not Radio Weekly e-Newsletter</h1>
    <div class="bottom-spacer_20">Sign up for Y-Not Radio's weekly e-mail newsletter, or Y-Mail as we like to call it. Then you'll have all of our programming information as well as news on upcoming concerts, album reviews, ticket giveaways, and more delivered right to you.</div>
		<!--
		Do not modify the NAME value of any of the INPUT fields
		the FORM action, or any of the hidden fields (eg. input type=hidden).
		These are all required for this form to function correctly.
		-->
		<form method="post" action="http://mailblast.vazoom.com/form.php?form=1" id="frmSS1" onsubmit="return CheckForm1(this);" class="form-default inline input-seperation">
			<table border="0" cellpadding="2" class="myForm">
				<tr>
			<td>Full Name:<span class="required"></span></td>
			<td><input type="text" name="CustomFields[13]" id="CustomFields_13_1" value="" size='50' maxlength='50'></td>
		</tr><tr>
			<td>Your Email Address:<span class="required"></span></td>
			<td><input type="text" name="email" value="" /></td>
		</tr><tr>
			<td>Birth Date:</td>
			<td><select name="CustomFields[7][mm]" id="CustomFields_7_mm">
				<option value="01">Jan</option>
				<optionvalue="02">Feb</option>
				<optionvalue="03">Mar</option>
				<optionvalue="04">Apr</option>
				<optionvalue="05">May</option>
				<optionvalue="06">Jun</option>
				<optionvalue="07">Jul</option>
				<optionvalue="08">Aug</option>
				<optionvalue="09">Sep</option>
				<optionvalue="10">Oct</option>
				<optionvalue="11">Nov</option>
				<optionvalue="12">Dec</option>
			</select>
			<select name="CustomFields[7][dd]" id="CustomFields_7_dd">
				<option value="01">1</option>
				<optionvalue="02">2</option>
				<optionvalue="03">3</option>
				<optionvalue="04">4</option>
				<optionvalue="05">5</option>
				<optionvalue="06">6</option>
				<optionvalue="07">7</option>
				<optionvalue="08">8</option>
				<optionvalue="09">9</option>
				<optionvalue="10">10</option>
				<optionvalue="11">11</option>
				<optionvalue="12">12</option>
				<optionvalue="13">13</option>
				<optionvalue="14">14</option>
				<optionvalue="15">15</option>
				<optionvalue="16">16</option>
				<optionvalue="17">17</option>
				<optionvalue="18">18</option>
				<optionvalue="19">19</option>
				<optionvalue="20">20</option>
				<optionvalue="21">21</option>
				<optionvalue="22">22</option>
				<optionvalue="23">23</option>
				<optionvalue="24">24</option>
				<optionvalue="25">25</option>
				<optionvalue="26">26</option>
				<optionvalue="27">27</option>
				<optionvalue="28">28</option>
				<optionvalue="29">29</option>
				<optionvalue="30">30</option>
				<optionvalue="31">31</option>
			</select>
			<select name="CustomFields[7][yy]" id="CustomFields_7_yy">
				<option value="1915">1915</option>
				<optionvalue="1916">1916</option>
				<optionvalue="1917">1917</option>
				<optionvalue="1918">1918</option>
				<optionvalue="1919">1919</option>
				<optionvalue="1920">1920</option>
				<optionvalue="1921">1921</option>
				<optionvalue="1922">1922</option>
				<optionvalue="1923">1923</option>
				<optionvalue="1924">1924</option>
				<optionvalue="1925">1925</option>
				<optionvalue="1926">1926</option>
				<optionvalue="1927">1927</option>
				<optionvalue="1928">1928</option>
				<optionvalue="1929">1929</option>
				<optionvalue="1930">1930</option>
				<optionvalue="1931">1931</option>
				<optionvalue="1932">1932</option>
				<optionvalue="1933">1933</option>
				<optionvalue="1934">1934</option>
				<optionvalue="1935">1935</option>
				<optionvalue="1936">1936</option>
				<optionvalue="1937">1937</option>
				<optionvalue="1938">1938</option>
				<optionvalue="1939">1939</option>
				<optionvalue="1940">1940</option>
				<optionvalue="1941">1941</option>
				<optionvalue="1942">1942</option>
				<optionvalue="1943">1943</option>
				<optionvalue="1944">1944</option>
				<optionvalue="1945">1945</option>
				<optionvalue="1946">1946</option>
				<optionvalue="1947">1947</option>
				<optionvalue="1948">1948</option>
				<optionvalue="1949">1949</option>
				<optionvalue="1950">1950</option>
				<optionvalue="1951">1951</option>
				<optionvalue="1952">1952</option>
				<optionvalue="1953">1953</option>
				<optionvalue="1954">1954</option>
				<optionvalue="1955">1955</option>
				<optionvalue="1956">1956</option>
				<optionvalue="1957">1957</option>
				<optionvalue="1958">1958</option>
				<optionvalue="1959">1959</option>
				<optionvalue="1960">1960</option>
				<optionvalue="1961">1961</option>
				<optionvalue="1962">1962</option>
				<optionvalue="1963">1963</option>
				<optionvalue="1964">1964</option>
				<optionvalue="1965">1965</option>
				<optionvalue="1966">1966</option>
				<optionvalue="1967">1967</option>
				<optionvalue="1968">1968</option>
				<optionvalue="1969">1969</option>
				<optionvalue="1970">1970</option>
				<optionvalue="1971">1971</option>
				<optionvalue="1972">1972</option>
				<optionvalue="1973">1973</option>
				<optionvalue="1974">1974</option>
				<optionvalue="1975">1975</option>
				<optionvalue="1976">1976</option>
				<optionvalue="1977">1977</option>
				<optionvalue="1978">1978</option>
				<optionvalue="1979">1979</option>
				<optionvalue="1980">1980</option>
				<optionvalue="1981">1981</option>
				<optionvalue="1982">1982</option>
				<optionvalue="1983">1983</option>
				<optionvalue="1984">1984</option>
				<optionvalue="1985">1985</option>
				<optionvalue="1986">1986</option>
				<optionvalue="1987">1987</option>
				<optionvalue="1988">1988</option>
				<optionvalue="1989">1989</option>
				<optionvalue="1990">1990</option>
				<optionvalue="1991">1991</option>
				<optionvalue="1992">1992</option>
				<optionvalue="1993">1993</option>
				<optionvalue="1994">1994</option>
				<optionvalue="1995">1995</option>
				<optionvalue="1996">1996</option>
				<optionvalue="1997">1997</option>
				<optionvalue="1998">1998</option>
				<optionvalue="1999">1999</option>
				<optionvalue="2000">2000</option>
				<optionvalue="2001">2001</option>
				<optionvalue="2002">2002</option>
				<optionvalue="2003">2003</option>
				<optionvalue="2004">2004</option>
				<optionvalue="2005">2005</option>
				<optionvalue="2006">2006</option>
				<optionvalue="2007">2007</option>
				<optionvalue="2008">2008</option>
				<optionvalue="2009">2009</option>
				<optionvalue="2010">2010</option>
				<optionvalue="2011">2011</option>
				<optionvalue="2012">2012</option>
				<optionvalue="2013">2013</option>
				<optionvalue="2014">2014</option>
				<optionvalue="2015">2015</option>
			</select>
		</td>
		</tr><input type="hidden" name="format" value="h" /><tr>
			<td>Enter the security code shown:<span class="required"></span></td>
			<td><script type="text/javascript">
		// <![CDATA[
			if (!Application) var Application = {};
			if (!Application.Page) Application.Page = {};
			if (!Application.Page.ClientCAPTCHA) {
				Application.Page.ClientCAPTCHA = {
					sessionIDString: '',
					captchaURL: [],
					getRandomLetter: function () { return String.fromCharCode(Application.Page.ClientCAPTCHA.getRandom(65,90)); },
					getRandom: function(lowerBound, upperBound) { return Math.floor((upperBound - lowerBound + 1) * Math.random() + lowerBound); },
					getSID: function() {
						if (Application.Page.ClientCAPTCHA.sessionIDString.length <= 0) {
							var tempSessionIDString = '';
							for (var i = 0; i < 32; ++i) tempSessionIDString += Application.Page.ClientCAPTCHA.getRandomLetter();
							Application.Page.ClientCAPTCHA.sessionIDString.length = tempSessionIDString;
						}
						return Application.Page.ClientCAPTCHA.sessionIDString;
					},
					getURL: function() {
						if (Application.Page.ClientCAPTCHA.captchaURL.length <= 0) {
							var tempURL = 'http://mailblast.vazoom.com/admin/resources/form_designs/captcha/index.php?c=';

													tempURL += Application.Page.ClientCAPTCHA.getRandom(1,1000);
															tempURL += '&ss=' + Application.Page.ClientCAPTCHA.getSID();
														Application.Page.ClientCAPTCHA.captchaURL.push(tempURL);
											}
						return Application.Page.ClientCAPTCHA.captchaURL;
					}
				}
			}

			var temp = Application.Page.ClientCAPTCHA.getURL();
			for (var i = 0, j = temp.length; i < j; i++) document.write('<img src="' + temp[i] + '" alt="img' + i + '" />');
		// ]]>
		</script>
		<br/><input type="text" name="captcha" value="" /></td>
		</tr>
				<tr>
					<td></td>
					<td>
						<button class="btn-large btn-success" type="submit" name="Subscribe" id="Subscribe" value="Subscribe">Subscribe</button>
						<br/><br><span style="display: block; font-size: 10px; color: gray; padding-top: 5px;"><a href="http://www.vazoom.com/" target="__blank" style="font-size:10px;color:gray;">Email Marketing</a> by Vazoom</span>
					</td>
				</tr>
			</table>
		</form>

		<script type="text/javascript">
		// <![CDATA[

					function CheckMultiple1(frm, name) {
						for (var i=0; i < frm.length; i++)
						{
							fldObj = frm.elements[i];
							fldId = fldObj.id;
							if (fldId) {
								var fieldnamecheck=fldObj.id.indexOf(name);
								if (fieldnamecheck != -1) {
									if (fldObj.checked) {
										return true;
									}
								}
							}
						}
						return false;
					}
				function CheckForm1(f) {
					var email_re = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
					if (!email_re.test(f.email.value)) {
						alert("Please enter your email address.");
						f.email.focus();
						return false;
					}

						if (f.captcha.value == "") {
							alert("Please enter the security code shown");
							f.captcha.focus();
							return false;
						}

					var fname = "CustomFields_13_1";
					var fld = document.getElementById(fname);
					if (fld.value == "") {
						alert("Please enter a value for field Full Name");
						fld.focus();
						return false;
					}

						return true;
					}

		// ]]>
		</script>
    </form>
    <a href="http://mailblast.vazoom.com/index.php?c=front&amp;m=changeEmail&amp;uk=4YAr3M" target="_blank">Change Your Email Address</a>
    <br>
    <a href="http://mailblast.vazoom.com/index.php?c=front&amp;m=unsubscribe&amp;uk=4YAr3M" target="_blank">Subscription Settings</a>
  </div>

  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
