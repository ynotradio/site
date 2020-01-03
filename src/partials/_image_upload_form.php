<form enctype="multipart/form-data" action="uploader.php" method="post" class="form-internal inline input-seperation" id="admin">
  <div class="control-group center">
    <div class="control"><input name="uploaded_file" type="file"></div>
  </div>
  <div class="center">
    <input type="hidden" name="MAX_FILE_SIZE" value="250000">
    <?php if ($upload_type == 'ads')
      echo "<input type=\"hidden\" value=\"ads\" name=\"directory\">";
    ?>
    <input type="submit" value="Upload Image" class="btn-success">
  </div>
</form>
