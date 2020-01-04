<?php
                               
$page_file = "adddeejayphoto.php";
$page_title = "Add a DeeJay Photo";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/deejay_fns.php");
open_db();	

	
if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/

// define a constant for the maximum upload size
define ('MAX_FILE_SIZE', 204800000);

/*
if ($_POST[submit] == "Submit") {
  echo "<pre>\n";
  print_r($_FILES);
  echo "</pre>\n\n";
}
*/

if ($_POST[submit] == "Submit") {
	// define constant for upload folder
	define('IMAGES_DIR', 'deejayphotos/');
	define('MAX_IMAGE_WIDTH', 650);
	define('MAX_IMAGE_HEIGHT', 500);

	// replace any spaces in original filename with underscores
	// at the same time, assign to a simpler variable
	$file = str_replace(' ', '_', $_FILES['image']['name']);
  	$file = strtolower($file);

	// convert the maximum size to KB
	$max = number_format(MAX_FILE_SIZE/1024, 1).'KB';

	// create an array of permitted MIME types
	$permitted = array('image/gif','image/jpeg','image/pjpeg','image/png');

	// begin by assuming the file is unacceptable
	$sizeOK = false;
	$typeOK = false;

	// check that file is within the permitted size
	if ($_FILES['image']['size'] > 0 && $_FILES['image']['size'] <=	MAX_FILE_SIZE) {
		$sizeOK = true;

	}

	// check that file is of a permitted MIME type
	foreach ($permitted as $type) {
		if ($type == $_FILES['image']['type']) {
			$typeOK = true;
			break;
		}
	}

	if ($sizeOK && $typeOK) {

    if ($_FILES['image']['error'] == 0) {
      if (!file_exists($file)) {
		    // move the file to the upload folder and rename it
		 	$success = move_uploaded_file($_FILES['image']['tmp_name'], $file);
		    $original = $file;

		  } else {
		    ini_set('date.timezone', 'America/Chicago');
		    $now = date('YmdHis');
		    $success = move_uploaded_file($_FILES['image']['tmp_name'], $now."_".$file);
		    $original = $now."_".$file;
      }
    }

    if ($success) {

			// begin by getting the details of the original
			list($width, $height, $type) = getimagesize($original);

			// calculate the scaling ratios
			if ($width <= MAX_IMAGE_WIDTH && $height <= MAX_IMAGE_HEIGHT) {
				$image_ratio = 1;
			}	elseif ($width > $height) {
				$image_ratio = MAX_IMAGE_WIDTH/$width;
			}	else {
				$image_ratio = MAX_IMAGE_HEIGHT/$height;
			}

			// strip the extension off the image filename
			$imagetypes = array('/\.gif$/','/\.jpg$/','/\.jpeg$/','/\.png$/');
			$name = preg_replace($imagetypes, '', basename($original));

			// create an image resource for the original
			if ($type == 1) {
				$source = @ imagecreatefromgif($original);
				if (!$source) {
					$errors[] = "Cannot process GIF files. Please use JPEG or PNG.";
				}
			} else if ($type == 2) {
				$source = imagecreatefromjpeg($original);
			} else if ($type == 3) {
				$source = imagecreatefrompng($original);
			} else {
				$source = NULL;
				$errors[] = "Cannot identify file type.";
			}

			if (!$source) {
				$errors[] = "Problem copying original.";
			}	else {

				// calculate the dimensions of the new image
				$image_width = round($width * $image_ratio);
				$image_height = round($height * $image_ratio);

				// create an image resource for the thumbnail
				$image = imagecreatetruecolor($image_width, $image_height);

				// create the resized copy
				imagecopyresampled($image, $source, 0, 0, 0, 0, $image_width, $image_height, $width, $height);

				// save the resized copy
				if ($type == 1) {
					if (function_exists('imagegif')) {
						$success2 = imagegif($image, IMAGES_DIR.$name.'.gif');
						$image_name = $name.'.gif';
					} else {
						$success2 = imagejpeg($image, IMAGES_DIR.$name.'.jpg', 100);
						$image_name = $name.'.jpg';
					}
				} else if ($type == 2) {
					$success2 = imagejpeg($image, IMAGES_DIR.$name.'.jpg', 100);
					$image_name = $name.'.jpg';
				} else if ($type == 3) {
					$success2 = imagepng($image, IMAGES_DIR.$name.'.png');
					$image_name = $name.'.png';
				}

				if (!$success2) {
					$errors[] = "Problem creating image.";
				}

				// insert into db
				$dj = $_POST['deejay'];
				$deejay = $_POST['deejay'];
				if (!get_magic_quotes_gpc())
					{
						$deejay = addslashes($deejay);
					}
				addphotostodb($image_height, $image_width, $file, $deejay);

			}

			// remove the image resources from memory
			imagedestroy($source);
			imagedestroy($image);
			unlink($original);
    }
    
  } elseif ($_FILES['image']['error'] == 4) {
	  $errors[] = 'No file selected';
	} else {
	  $errors[] = "$file cannot be uploaded.";
		if (!$sizeOK) {
			$errors[] = "Maximum size: $max.";
		}
		if (!$typeOK) {
			$errors[] = "Acceptable file types: GIF, JPG, PNG.";
		}
	}

  if (isset($errors)) {
		$count = 0;
		echo '<p>';
		foreach ($errors as $item) {
			if ($count > 0) { echo "<br/>\n"; }
			echo "<strong>$item</strong>";
			$count++;
		}
    echo '</p>';
  } else {
    echo "<br>Deejay Photo has been added!</p>\n".
    	 "<p><img src=\"deejayphotos/$file\"/></p>\n".
    	 '<p><b>DeeJay:</b>'.$dj.'</p>'.
    	 '<p><b>Copy this line for the DeeJay Profile :</b>/deejayphotos/'.$file.'</p>';
  }
	echo "<hr width=\"80%\">\n";
	echo "<a href=\"adddeejayphoto.php\">Add Another Photo</a>\n";

}
}
?>
<div style="padding: 2em;" align="center">
<h2>Add a DeeJay Photo</h2>
<form action="<?php echo $_SERVER[PHP_SELF] ?>" method="post" enctype="multipart/form-data">
<input type="hidden" name="MAX_FILE_SIZE" value="<?php echo MAX_FILE_SIZE; ?>" />
Image:<input type="file" name="image" size="37"/>
<br>Deejay:<input type="text" name="deejay"/ size="50">
<p>
<input type="submit" name="submit" value="Submit" /></p>
</form>
</div>
<?php
require("ext/footer.php");
?>