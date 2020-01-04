<table class="table-center">
  <thead>
    <tr>
      <th></th>
      <th>Artist</th>
      <th>Song</th>
      <th>Note</th>
    </tr>
  </thead>
  <?php
    for ($i=1; $i <= mysqli_num_rows($top11); $i++) {
      $info = mysqli_fetch_assoc($top11);
      if ($info['placement'] == 98) {
        echo "<tr>
          <td><b>Status:</b></td>
          <td>" . ucfirst($info['artist']). "</td>
          <td colspan=2></td>
          </tr>\n";
      } elseif ($info['placement'] == 99) {
        echo "<tr>
          <td><b>Date:</b></td>
          <td> <input type=\"text\" value=\"" . $info['artist']. "\" name=\"date\" class=\"input-m\"></td>
          <td colspan=2></td>
          </tr>\n";
      }	else {
        echo "<tr>
            <td>" . $info['placement'] . "</td>
            <td> <input type=\"text\" value=\"" .$info['artist']. "\" name=\"artist_".$i."\" class=\"input-m\"></td>
            <td> <input type=\"text\" value=\"" .$info['song']. "\" name=\"song_".$i."\" class=\"input-m\"></td>
            <td> <input type=\"text\" value=\"" .$info['note']. "\" name=\"note_".$i."\" class=\"input-m\"></td>
        </tr>\n";
      }
    }
  ?>
  <tr>
    <td></td>
    <td></td>
    <td>
      <input type="submit" value="Update Top 11 @ 11" class="btn-info">
    </td>
  </tr>
  <input type="hidden" name="action" value="insert">
</table>
