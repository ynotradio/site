<?php

function add_mrm_band($name, $url, $pic_url, $placement, $seed, $abbr, $sponsor)
{
    $name = mysqli_real_escape_string(open_db(), $name);
    $url = mysqli_real_escape_string(open_db(), $url);
    $pic_url = mysqli_real_escape_string(open_db(), $pic_url);
    $placement = mysqli_real_escape_string(open_db(), $placement);
    $seed = mysqli_real_escape_string(open_db(), $seed);
    $abbr = mysqli_real_escape_string(open_db(), $abbr);
    $sponsor = mysqli_real_escape_string(open_db(), $sponsor);

    $insert = "INSERT INTO mrm_bands VALUES (id, '" . $name . "', '" . $url . "', '" . $pic_url . "', '" . $placement . "', '" . $seed . "', '" . $abbr . "','" . $sponsor . "')";
    $link = open_db();
    $result = mysqli_query($link, $insert);

    if (!$result) {
        echo $insert . "<br>";
        die('Error Inserting into Database.');
    }

    echo "<div class=\"center\"><h1>Success!</h1>" .
        "<h3>New MRM band, " . $name . ", has been saved</h3>" .
        "<hr width=75%>";
    display_mrm_band(get_mrm_band(mysqli_insert_id($link)));
    echo "</div>";
}

function band_name($id)
{
    $query = "SELECT name FROM mrm_bands where id=" . $id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        die('No results in database.');
    }

    $info = mysqli_fetch_assoc($result);

    return $info['name'];
}

function delete_mrm_band($id)
{
    $mrm_band = get_mrm_band($id);

    $update = "DELETE FROM mrm_bands where id=" . $id;
    $result = mysqli_query(open_db(), $update);

    if (!$result) {
        echo "'Error deleting the modern rock band from the database: " . $update . "<br>";
    } else {
        echo "<div class=\"center\"><h1>Success!</h1>" .
            "<h3>The band <span class=\"success\">" . $mrm_band['name'] . "</span> has been deleted.</h3></div>";
    }
}

function countdown_values($match_id)
{
    $select = "SELECT HOUR(TIMEDIFF(end_time, now())) as hr, MINUTE(TIMEDIFF(end_time, now())) as min, SECOND(TIMEDIFF(end_time, now())) as sec FROM mrm_matches WHERE id = " . $match_id;
    $result = mysqli_query(open_db(), $select);

    if (!$result) {
        echo $select . "<br>";
        die('Invalid');
    }

    $countdown_values = mysqli_fetch_assoc($result);
    echo "<div class=\"hidden\" id=\"hr\">" . $countdown_values['hr'] . "</div>
    <div class=\"hidden\" id=\"min\">" . $countdown_values['min'] . "</div>
    <div class=\"hidden\" id=\"sec\">" . $countdown_values['sec'] . "</div>";
}

/**
 * Get the tournament dates based on a start date
 * 
 * @param string $start_date Start date of the tournament in Y-m-d format
 * @return array Array of dates for each tournament round
 */
function get_tournament_dates($start_date)
{
    // Parse the start date
    $tournament_start = strtotime($start_date);
    
    // Ensure the start date is a Monday (1 = Monday, 7 = Sunday)
    $day_of_week = date('N', $tournament_start);
    if ($day_of_week != 1) {
        // Adjust to next Monday if not already a Monday
        $tournament_start = strtotime('next Monday', $tournament_start);
    }
    
    // Calculate all tournament dates
    $dates = [];
    
    // First Round - Left side (Monday-Tuesday of Week 1)
    $first_round_left_start = $tournament_start;
    $first_round_left_end = strtotime('+1 day', $first_round_left_start);
    $dates['first_round_left'] = date('F j', $first_round_left_start) . '-' . date('j', $first_round_left_end);
    
    // First Round - Right side (Wednesday-Thursday of Week 1)
    $first_round_right_start = strtotime('+2 days', $first_round_left_start);
    $first_round_right_end = strtotime('+1 day', $first_round_right_start);
    $dates['first_round_right'] = date('F j', $first_round_right_start) . '-' . date('j', $first_round_right_end);
    
    // Second Round - Left side (Monday of Week 2)
    $second_round_left = strtotime('+7 days', $first_round_left_start);
    $dates['second_round_left'] = date('F j', $second_round_left);
    
    // Second Round - Right side (Tuesday of Week 2)
    $second_round_right = strtotime('+1 day', $second_round_left);
    $dates['second_round_right'] = date('F j', $second_round_right);
    
    // Sweet 16 - Both sides (Wednesday of Week 2)
    $sweet_16 = strtotime('+2 days', $second_round_left);
    $dates['sweet_16'] = date('F j', $sweet_16);
    
    // Elusive 8 - Both sides (Thursday of Week 2)
    $elusive_8 = strtotime('+3 days', $second_round_left);
    $dates['elusive_8'] = date('F j', $elusive_8);
    
    // Final 4 - Both sides (Thursday of Week 2, same day as Elusive 8)
    $dates['final_4'] = date('F j', $elusive_8);
    
    // Championship (Friday of Week 2)
    $championship = strtotime('+4 days', $second_round_left);
    $dates['championship'] = date('F j', $championship);
    
    return $dates;
}

/**
 * Format a timeline item for the tournament schedule
 * 
 * @param string $title The round title
 * @param string $date The formatted date string
 * @param bool $use_padding Whether to add top padding class
 * @return string HTML for the timeline item
 */
function format_timeline_item($title, $date, $use_padding = false)
{
    $padding_class = $use_padding ? ' class="top-pad_3"' : '';
    return "<li{$padding_class}><strong>{$title}</strong>{$date}</li>\n";
}

/**
 * Displays the timeline for the tournament rounds
 * 
 * @param string $start_date Start date of the tournament in Y-m-d format (e.g. '2025-03-17')
 * @return void
 */
function display_first_row($start_date = null)
{
    // Default to current year March 17th if no date provided
    if ($start_date === null) {
        $start_date = date('Y') . '-03-17';
    }
    
    // Get all tournament dates
    $dates = get_tournament_dates($start_date);
    
    // Start the timeline
    echo "<ul id='time_line'>\n";
    
    // Left side of the bracket (first to championship)
    echo format_timeline_item("1<sup>st</sup> ROUND", $dates['first_round_left']);
    echo format_timeline_item("2<sup>nd</sup> ROUND", $dates['second_round_left']);
    echo format_timeline_item("SWELL 16", $dates['sweet_16'], true);
    echo format_timeline_item("ELUSIVE 8", $dates['elusive_8'], true);
    echo format_timeline_item("FANTASTIC 4", $dates['final_4'], true);
    
    // Championship (center)
    echo format_timeline_item("CHAMPION", $dates['championship'], true);
    
    // Right side of the bracket (championship to first)
    echo format_timeline_item("FANTASTIC 4", $dates['final_4'], true);
    echo format_timeline_item("ELUSIVE 8", $dates['elusive_8'], true);
    echo format_timeline_item("SWELL 16", $dates['sweet_16'], true);
    echo format_timeline_item("2<sup>nd</sup> ROUND", $dates['second_round_right']);
    echo format_timeline_item("1<sup>st</sup> ROUND", $dates['first_round_right']);
    
    // Close the timeline
    echo "</ul>\n";
}

function display_mrm_band($mrm_band)
{
    echo "\n<br><b>Name:</b> " . $mrm_band['name'] .
        "\n<br><b>Name Abbr:</b> " . $mrm_band['abbr'] .
        "\n<br><b>Url:</b> " . $mrm_band['url'] .
        "\n<br><b>Seed:</b> " . $mrm_band['seed'] .
        "\n<br><b>Picture:</b><br> <img src=\"" . $mrm_band['pic_url'] . "\" width=\"250px\"/>" .
        "\n<br><b>Placement:</b> " . $mrm_band['placement'] .
        "\n<br><b>Sponsor:</b> " . $mrm_band['sponsor'];
}

function get_band_abbr($id)
{
    $query = "SELECT abbr FROM mrm_bands where placement=" . $id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        die('No results in database.');
    }

    $info = mysqli_fetch_assoc($result);

    return $info['abbr'];
}

function get_sponsor_name($placement)
{
    $query = "SELECT sponsor, seed FROM mrm_bands WHERE placement = " . $placement;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    return "<span class='seed_size'>Sponsored by: " . $info['sponsor'] . "</span> ";
}

function get_band_name($placement)
{
    if ($placement == 0) {
        return "TBD";
    }

    $query = "SELECT name, seed FROM mrm_bands WHERE placement = " . $placement;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    return "<span class='seed_size'>" . $info['seed'] . "</span> " . $info['name'];
}

function get_band_pic_url($placement)
{
    $query = "SELECT pic_url FROM mrm_bands WHERE placement = " . $placement;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    return $info['pic_url'];
}

function get_band_url($placement)
{
    $query = "SELECT url FROM mrm_bands WHERE placement = " . $placement;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    return $info['url'];
}

function get_mrm_band($id)
{
    $query = "SELECT * FROM mrm_bands where id=" . $id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo 'No results in database.';
    } else {
        return mysqli_fetch_assoc($result);
    }

}

function get_mrm_sponsor($id)
{
    $query = "SELECT * FROM mrm_matches where id=" . $id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo 'No results in database.';
    } else {
        return mysqli_fetch_assoc($result);
    }

}

function seed($placement)
{
    $query = "SELECT seed FROM mrm_bands where placement=" . $placement;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        die('No results seed in database.');
    }

    $info = mysqli_fetch_assoc($result);

    return $info['seed'];
}

function band_pic($id)
{
    $query = "SELECT pic_url FROM mrm_bands where id=" . $id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        die('No results in database.');
    }

    $info = mysqli_fetch_assoc($result);

    return $info['pic_url'];
}

function update_mrm_band($id, $name, $url, $pic_url, $placement, $seed, $abbr, $sponsor)
{
    $name = mysqli_real_escape_string(open_db(), $name);
    $url = mysqli_real_escape_string(open_db(), $url);
    $pic_url = mysqli_real_escape_string(open_db(), $pic_url);
    $placement = mysqli_real_escape_string(open_db(), $placement);
    $seed = mysqli_real_escape_string(open_db(), $seed);
    $abbr = mysqli_real_escape_string(open_db(), $abbr);
    $sponsor = mysqli_real_escape_string(open_db(), $sponsor);

    $update = "UPDATE mrm_bands SET name=\"$name\", url=\"$url\", pic_url=\"$pic_url\", placement=\"$placement\", seed=\"$seed\", abbr=\"$abbr\", sponsor=\"$sponsor\" WHERE id=" . $id;
    $result = mysqli_query(open_db(), $update);

    if (!$result) {
        echo "There was an error updating: <br>" . $update;
    } else {
        return $result;
    }

}

function update_mrm_sponsor($match, $sponsor, $sponsor_msg)
{
    $id = mysqli_real_escape_string(open_db(), $match);
    $sponsor = mysqli_real_escape_string(open_db(), $sponsor);
    $sponsor_msg = mysqli_real_escape_string(open_db(), $sponsor_msg);

    $update = "UPDATE mrm_matches SET sponsor=\"$sponsor\", sponsor_msg=\"$sponsor_msg\" WHERE id=" . $id;
    $result = mysqli_query(open_db(), $update);

    if (!$result) {
        echo "There was an error updating: <br>" . $update;
    } else {
        return $result;
    }

}

function vote_percentage($val1, $val2, $display = 'none')
{
    if ($val1 == 0 and $val2 == 0) {
        if ($display == 'none') {
            return "";
        } else {
            return "50%";
        }
    } else {
        return round((($val1 / ($val1 + $val2)) * 100), 0) . '%';
    }

}

function vote($match_id, $band_number, $by_pass_ip_check, $round = 1)
{
    $band = "band" . $band_number . "_votes";
    $band_id = "band" . $band_number . "_id";

    $query = "SELECT " . $band_id . ", " . $band . ", end_time FROM mrm_matches WHERE id =" . $match_id;
    $q_result = mysqli_query(open_db(), $query);

    if (!$q_result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($q_result);

    $voted_band = $info["band" . $band_number . "_id"];

    $match_end_time = $info["end_time"];

    $match_has_passed = strtotime($match_end_time) < strtotime('now');

    if ((!has_voted($match_id) || $by_pass_ip_check) && !$match_has_passed) {
        $update = "UPDATE mrm_matches SET " . $band . " = " . ($info["band" . $band_number . "_votes"] + 1) . " WHERE id = " . $match_id;
        $u_result = mysqli_query(open_db(), $update);

        if (!$u_result) {
            echo "error: " . $update;
            die('Invalid');
        }
    }

    if ($by_pass_ip_check) {
        view_matches($round);
    } else {
        record_ip($match_id, $voted_band);
    }

}

function view_matches($round)
{
    $query = get_query($round);
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }

    for ($i = 1; $i <= mysqli_num_rows($result); $i++) {
        $match = mysqli_fetch_assoc($result);

        $live_match = (now_match() == $match) ? "id=\"live_match\"" : '';
        echo "<table class=\"bottom-spacer_20 table-center\"" . $live_match . ">\n
      <tr>\n<td class='mrm_band" . winner($match['band1_id'], $match["id"]) . "'>" . get_band_name($match['band1_id']) . "</td>\n<td></td>\n<td class='mrm_band" . winner($match['band2_id'], $match["id"]) . "'>" . get_band_name($match['band2_id']) . "</td>\n</tr>\n" .
        "<tr>\n<td class='" . winner($match['band1_id'], $match["id"]) . "'><img src=\"" . get_band_pic_url($match['band1_id']) . "\" width=\"200px\"></td>\n<td " . timer_or_vs($match) . " class='middle'> VS </td>\n<td class='" . winner($match['band2_id'], $match["id"]) . "'>" . "<img src=\"" . get_band_pic_url($match['band2_id']) . "\" width=\"200px\"></td>\n</tr>\n";

        echo "<tr class=\"scoreboard\">";
        admin_scoreboard($match);
        echo "</tr>";
        voting_status_message_for($match);
        voting_buttons($match, $round);
        show_close_match($match, $round);
        echo "<tr>\n<td class=\"text-right\">Start Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['start_time'])) . "</td></tr>";
        echo "<tr>\n<td class=\"text-right\">End Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['end_time'])) . "</td></tr>";

        echo "</table>\n";

        echo "<table class=\"bottom-spacer_20 table-center\"" . $live_match . ">\n
          <tr><td><strong>Match sponsored by: " . $match['sponsor'] . "</strong></td></tr>\n
          <tr><td>" . $match['sponsor_msg'] . "</td></tr>\n
          <tr><td><a href='/mrm_manage_sponsor.php?match=" . $match['id'] . "'>Edit</a></td></tr>";
        echo "</table>\n";
    }
}

function timer_or_vs($match)
{
    return ($match == now_match()) ? "id=\"mrm_timer\"" : '';
}

function voting_buttons($match, $round)
{
    $match_status = get_match_status($match['id']);

    if (open_match($match)) {
        echo "<tr>";
        for ($i = 1; $i <= 2; $i++) {
            echo "<td class=\"center\">
        <form action=\"mrm_manage_matches.php\" class=\"for_band" . $i . "\" method=\"post\">
          <input type=\"hidden\" id=\"action\" name=\"action\" value =\"write\">
          <input type=\"hidden\" id=\"match\" name=\"match\" value =\"" . $match['id'] . "\">
          <input type=\"hidden\" id=\"band\" name=\"band\" value =\"" . $i . "\">
          <input type=\"hidden\" id=\"round\" name=\"round\" value =\"" . $round . "\">
          <input type=\"submit\" class=\"vote_for_band" . $i . " btn-success\" value=\"Manual Vote\">
          </form>\n<td>";
        }
        echo "</tr>";
    }
}

function open_match($match)
{
    $match_status = get_match_status($match['id']);

    return ($match_status == "running" || (match_is_tied($match) && $match_status == "over"));
}

function voting_status_message_for($match)
{
    $match_status = get_match_status($match['id']);

    if ($match_status == "early") {
        $message = "Voting has not started";
    } elseif ($match_status == "over" && match_is_tied($match)) {
        $message = "Match is over and tied - vote for the winner";
    } elseif ($match_status == "over" && !match_is_tied($match)) {
        $message = "Voting is now over";
    }

    echo "<tr><td colspan=\"3\" class=\"voting_message\">" . $message . "</td></tr>";
}

function show_close_match($match, $round)
{
    $match_status = get_match_status($match['id']);

    if ($match_status == "over" && !match_is_tied($match) && $match['winner_id'] == "0") {
        echo "<tr>\n<td colspan=\"3\" class=\"center\">";
        echo "<form action=\"mrm_manage_matches.php\" method=\"post\">
        <input type=\"hidden\" name=\"action\" value =\"close\">
        <input type=\"hidden\" name=\"match\" value =\"" . $match['id'] . "\">
        <input type=\"hidden\" name=\"round\" value =\"" . $round . "\">
        <input type=\"submit\" class=\"btn-danger\" value=\"Close Match\">
        </form>\n";
        echo "</td>\n</tr>";
    }
}

function get_match($id)
{
    $query = "SELECT * FROM mrm_matches WHERE id =" . $id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo 'No results in database.';
    } else {
        return mysqli_fetch_assoc($result);
    }

}

function get_match_status($match_id)
{
    $query = "SELECT * FROM mrm_matches WHERE id =" . $match_id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error with " . $match_id . ": " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    if (now() > $info['end_time']) {
        return "over";
    } elseif (now() > $info['start_time']) {
        return "running";
    } else {
        return "early";
    }
}

function match_is_tied($match)
{
    return ($match['band1_votes'] == $match['band2_votes']);
}

function is_match_closed($match_id)
{
    $query = "SELECT * FROM mrm_matches WHERE id =" . $match_id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }

    $info = mysqli_fetch_assoc($result);

    if ($info['winner_id'] != 0) {
        return true;
    } else {
        return false;
    }

}

function now()
{
    return date("Y-m-d H:i:s", time());
}

function close_match($match_id, $round)
{
    $winner_id = set_winner($match_id);
    enable_score($match_id);

    if ($match_id < 63) {
        setup_next_match($match_id, $winner_id);
    }

    view_matches($round);
}

function enable_score($match_id)
{
    $update = "UPDATE mrm_matches SET show_score = true WHERE id =" . $match_id;
    $result = mysqli_query(open_db(), $update);

    if (!$result) {
        echo $update . "<br>";
        die('Error enabling score.');
    }
}

function set_winner($match_id)
{
    $query = "SELECT * FROM mrm_matches WHERE id =" . $match_id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo $query . "<br>";
        die('Error Updating Database.');
    }

    $info = mysqli_fetch_assoc($result);

    if ($info['band1_votes'] > $info['band2_votes']) {
        $winner = $info['band1_id'];
    } else {
        $winner = $info['band2_id'];
    }

    $update = "UPDATE mrm_matches SET winner_id=\"" . $winner . "\" WHERE id=" . $match_id;
    $result = mysqli_query(open_db(), $update);

    if (!$result) {
        echo $update . "<br>";
        die('Error Updating Database.');
    }
    return $winner;
}

function setup_next_match($last_match_id, $winner_id)
{
    //if last_match_id is even vs. odd figures out if band1_id / band2_id
    $new_match = get_new_match($last_match_id);
    $band_value = $last_match_id&1; // 0 = even, 1 = odd

    if ($band_value == 1) {
        $update = "UPDATE mrm_matches SET band1_id=\"$winner_id\" WHERE id=" . $new_match;
    } else {
        $update = "UPDATE mrm_matches SET band2_id=\"$winner_id\" WHERE id=" . $new_match;
    }

    $result = mysqli_query(open_db(), $update);

    if (!$result) {
        echo $update . "<br>";
        die('Error Updating Database.');
    }
}

function get_new_match($old_match)
{
    $query = "SELECT * FROM mrm_matches_flow WHERE old =" . $old_match;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    return $info['new'];
}

function show_match($match_id)
{

    if ($match_id != 8888) {
        $match_status = get_match_status($match_id);

        $query = "SELECT * FROM mrm_matches WHERE id =" . $match_id;
        $result = mysqli_query(open_db(), $query);

        if (!$result) {
            echo $update . "<br>";
            die('Error Querying Database. Code: sm123');
        }

        $match = mysqli_fetch_assoc($result);

        echo '<table id="mrm_current_match" border="0">
      <tr>
        <td> ' . get_band_name($match['band1_id']) . '<br>' . get_sponsor_name($match['band1_id']) . '</td>
        <td></td>
        <td> ' . get_band_name($match['band2_id']) . '<br>' . get_sponsor_name($match['band2_id']) . '</td>
      </tr>
      <tr>
        <td> <img src="' . get_band_pic_url($match['band1_id']) . '"></td>
        <td class="middle" id="mrm_timer">';
        if ($match_status == 'over') {
            echo 'Match Over';
        }

        echo '</td>
      <td> <img src="' . get_band_pic_url($match['band2_id']) . '"></td></tr>
      <tr>';
        echo "<td class=\"hidden\">";
        countdown_values($match_id);
        echo "</td>";
        echo "</tr>\n<tr>";
        if ($match_status == 'early') {
            echo '<td colspan=3 class="center">Voting has not started yet</td>';
        } elseif ($match_status == 'running') {
            if (has_voted($match_id) == false) {
                echo '<td class="center">';
                vote_form($match["id"], 1);
                echo "</td>\n
          <td></td>\n
          <td class='center'>";
                vote_form($match["id"], 2);
                echo '</td>';
            } else {
                echo '<td colspan=3 class="center">Thanks for Voting!</td>';
            }
        } elseif ($match_status == 'over') {
            echo '<td colspan=3></td>';
        }
        echo "\n</tr>\n</table>\n";
        if ($match_status != "early") {
            echo '<table id="mrm_scoring" border="0">';
            scoreboard($match);
            echo '</table>';

        }
    }

    if (end_of_madness()) {
        winner_banner();
    } elseif (waiting_for_final()) {
        echo "<div class=\"top-spacer_20 center\"><strong>Hang in there, we are still counting up all of the votes...</strong></div>";
    } else {
        next_match();
    }

}

function waiting_for_final()
{
    $query = "SELECT * FROM mrm_matches WHERE id=63";
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    return ($info['end_time'] < now()) ? true : false;
}

function end_of_madness()
{
    $query = "SELECT * FROM mrm_matches WHERE id=63";
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    return ($info['winner_id'] == 0) ? false : true;
}

function admin_scoreboard($match)
{
    $match_status = get_match_status($match['id']);

    if ($match_status != 'early') {
        echo "<td id=\"band_1\" class='mrm_votes " . winner($match['band1_id'], $match["id"]) . "'>Votes: " . $match['band1_votes'] . " | " . vote_percentage($match['band1_votes'], $match['band2_votes']) . " </td>\n
      <td></td>\n
      <td id=\"band_2\" class='mrm_votes " . winner($match['band2_id'], $match["id"]) . "'>Votes: " . $match['band2_votes'] . " | " . vote_percentage($match['band2_votes'], $match['band1_votes']) . " </td>\n";
    }
}

function scoreboard($match)
{
    if ($match['show_score']) {
        echo '<tr>
    <td id="band1_score">' . vote_percentage($match['band1_votes'], $match['band2_votes'], "display") . '</td>
    <td id="band1_value" width="' . vote_percentage($match['band1_votes'], $match['band2_votes']) . '"></td>
    <td id="band2_value" width="' . vote_percentage($match['band2_votes'], $match['band1_votes']) . '"></td>
    <td id="band2_score">' . vote_percentage($match['band2_votes'], $match['band1_votes'], "display") . '</td>
    </tr>';

        echo "<script type='text/javascript'>
    $('.live_match > dl .band1 .percentage').text(\"" . vote_percentage($match['band1_votes'], $match['band2_votes']) . "\");
  $('.live_match > dl .band2 .percentage').text(\"" . vote_percentage($match['band2_votes'], $match['band1_votes']) . "\");
  </script>";
    } else {
        #echo "<tr>\n<td colspan=\"3\" class=\"center no-border\">Tune in at ".date('g:ia', strtotime($match['end_time']))." to find out the Modern Rock Madness 2014 Champion.</td>\n<tr>\n";
        echo "<script type='text/javascript'>
    $('.live_match > dl .band1 .percentage').text(\"" . vote_percentage($match['band1_votes'], $match['band2_votes']) . "\");
  $('.live_match > dl .band2 .percentage').text(\"" . vote_percentage($match['band2_votes'], $match['band1_votes']) . "\");
  </script>";
    }
}

function next_match()
{
    $next_query = "SELECT id, band1_id, band2_id, start_time, DATE_FORMAT(start_time, '%h:%i') as fdate FROM mrm_matches WHERE now() < start_time ORDER BY start_time LIMIT 1";
    $next_result = mysqli_query(open_db(), $next_query);

    if (!$next_result) {
        echo $next_update . "<br>";
        die('Error Finding Database.');
    }

    $next_match = mysqli_fetch_assoc($next_result);

    if ($next_match) {
        echo '<div id="next_match">
      <span>Next Match: </span><span class="seed_size">(' . seed($next_match['band1_id']) . ')</span> ' . get_band_name($next_match['band1_id']) . ' vs <span class="seed_size">(' . seed($next_match['band2_id']) . ')</span> ' . get_band_name($next_match['band2_id']) . ' | ';
        if (date('Ymd') + 1 == date('Ymd', strtotime($next_match['start_time']))) {
            echo "Tomorrow at ";
        } elseif (date('Ymd') + 1 < date('Ymd', strtotime($next_match['start_time']))) {
            echo date('m/d ', strtotime($next_match['start_time']));
        }

        echo $next_match['fdate'] . ' EST</div>';
    }
}

function now_match()
{
    $select = "SELECT * FROM mrm_matches WHERE now() >= start_time AND now() < end_time;";
    $result = mysqli_query(open_db(), $select);

    if (mysqli_errno(open_db())) {
        echo mysqli_error(open_db()) . "<br>";
        die('Error Finding Database.');
    }

    $now_match = mysqli_fetch_assoc($result);

    if ($now_match['id'] > 0) {
        return $now_match;
    }

    if ($now_match['id'] == '') {
        return array("id" => "8888");
    }
}

function winner($band_id, $match_id)
{
    $query = "SELECT * FROM mrm_matches WHERE id =" . $match_id;
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo $query . "<br>";
        die('Error Finding Database.');
    }

    $info = mysqli_fetch_assoc($result);

    if ($info['winner_id'] == 0) {
        return '';
    }

    if ($info['winner_id'] == $band_id) {
        return ' mrm_winner';
    } else {
        return ' mrm_loser';
    }

}

function get_query($round)
{
    if ($round == 1) {
        return "SELECT * FROM mrm_matches WHERE id > 0 AND ID <= 32 ORDER BY winner_id, id";
    } elseif ($round == 2) {
        return "SELECT * FROM mrm_matches WHERE id > 32 AND ID <= 48 ORDER BY winner_id, id";
    } elseif ($round == 3) {
        return "SELECT * FROM mrm_matches WHERE id > 48 AND ID <= 56 ORDER BY winner_id, id";
    } elseif ($round == 4) {
        return "SELECT * FROM mrm_matches WHERE id > 56 AND ID <= 60 ORDER BY winner_id, id";
    } elseif ($round == 5) {
        return "SELECT * FROM mrm_matches WHERE id > 60 AND ID <= 62 ORDER BY winner_id, id";
    } elseif ($round == 6) {
        return "SELECT * FROM mrm_matches WHERE id = 63";
    } else {
        return 'Error - not a valid round selected. <br> Round: ' . $round;
    }

}

function display_bracket()
{
    echo "\n<div id=\"bracket\">";
    for ($r = 1; $r <= 5; $r++) {
        echo "\n<div id='region_" . $r . "'>";
        $round_counter = 1;

        $query = "SELECT * FROM mrm_matches WHERE region = " . $r;
        $result = mysqli_query(open_db(), $query);

        if (!$result) {
            echo $update . "<br>";
            die('Error getting bracket data.');
        }

        for ($i = 1; $i <= mysqli_num_rows($result); $i++) { //loop through all matches in region
            $info = mysqli_fetch_assoc($result);
            if (($i == 1 || $i == 9 || $i == 13 || $i == 15) && $r < 5) {
                echo "\n<div class='round" . $round_counter . "'>";
                $round_counter++;
            }
            if ($info['id'] == 63) {
                $side = '';
            } elseif ($r <= 2 || $info['id'] == 62) {
                $side = ' left';
            } else {
                $side = ' right';
            }

            prep_match($info, $side);
            if (($i == 8 || $i == 12 || $i == 14 || $i == 15) && $r < 5) {
                echo "\n</div>"; //close round div
            }
        } //end of matches loop
        echo "</div>"; //end of region
    } // end region for loop
    sponsor();
    echo "</div>"; //close bracket div
}

function prep_match($match, $side)
{
    echo '<div class="match' . $side;
    if (get_match_status($match['id']) == "running") {
        echo ' live_match';
    }

    echo '" id="match' . $match['id'] . '">
    <dl>
    <dt class="band1' . winner($match['band1_id'], $match['id']) . '"><span class="seed">' . seed($match['band1_id']) . "</span><span class='band_abbr'>" .
    get_band_abbr($match['band1_id']) . "</span>";
    if ($match['show_score']) {
        echo "<span class='percentage'>" . vote_percentage($match['band1_votes'], $match['band2_votes']) . "</span>";
    }

    echo '</dt><dt class="band2' . winner($match['band2_id'], $match['id']) . '"><span class="seed">' . seed($match['band2_id']) . "</span><span class='band_abbr'>" .
    get_band_abbr($match['band2_id']) .
        "</span>";
    if ($match['show_score']) {
        echo "<span class='percentage'>" . vote_percentage($match['band2_votes'], $match['band1_votes']) . "</span>";
    }

    echo " </dt>\n</dl>\n</div>\n";
}

function sponsor()
{
    $current_match = now_match();
    if (isset($current_match['sponsor'])) {

        echo "<div class=\"sponsor\" id='sponsor_top'>\n" .
            "Match sponsored by\n" .
            "<br>\n" . $current_match['sponsor'];
        if (isset($current_match['sponsor_msg'])) {
            echo "<br>\n" . $current_match['sponsor_msg'];
        }
        echo "</div>\n";
        echo "<div class=\"sponsor\" id='sponsor_bottom'>\n" .
            "Match sponsored by\n" .
            "<br>\n" . $current_match['sponsor'];
        if (isset($current_match['sponsor_msg'])) {
            echo "<br>\n" . $current_match['sponsor_msg'];
        }
        echo "</div>\n";
    }
}

function has_voted($match_id)
{
    if ($_SESSION["logged_in"]) {
        return false;
    }

    $auth0 = $GLOBALS['auth0'];
    $userInfo = $auth0->getUser();
    $query = "SELECT match_id, voter_email FROM mrm_votes WHERE match_id = " . $match_id . " AND voter_email = '" . $userInfo['email'] . "'";
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo $update . "<br>";
        die('Error getting voter data.');
    }

    $info = mysqli_fetch_assoc($result);

    if ($info['match_id'] == '') {
        return false;
    } else {
        return true;
    }
}

function vote_form($match_id, $band_id)
{
    $auth0 = $GLOBALS['auth0'];

    $userInfo = $auth0->getUser();
    $voter_email = $userInfo['email'];

    if ($voter_email == null || trim($voter_email) == '') {
        echo '<a href="social_login.php" class="btn-success">Log in to vote</a>';
    } else {
        echo '<form action="madness.php" method="post">
        <input type="submit" class="btn-success" value="Vote!">
        <input type="hidden" name="match_id" value ="' . $match_id . '">
        <input type="hidden" name="band_id" value ="' . $band_id . '">
        <input type="hidden" name="voter_email" value ="' . $voter_email . '">
        </form>';
    }
}

function record_ip($match_id, $voted_band)
{
    $voter_ip = $_SERVER['REMOTE_ADDR'];
    $auth0 = $GLOBALS['auth0'];
    $userInfo = $auth0->getUser();

    if (has_voted($match_id) == false) {
        $insert = "INSERT INTO mrm_votes VALUES (id, '" . $match_id . "', '" . $voter_ip . "', '" . $voted_band . "', '" . $userInfo['email'] . "')";
        $link = open_db();
        $result = mysqli_query($link, $insert);

        if (!$result) {
            echo $insert . "<br>";
            die('Error Inserting VI.');
        }
    }
}

function view_all_mrm_bands()
{
    $query = "SELECT * FROM mrm_bands ORDER BY Placement";
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }

    echo '<ol>';
    for ($i = 1; $i <= mysqli_num_rows($result); $i++) {
        $info = mysqli_fetch_assoc($result);
        display_mrm_band($info);
        echo '<br>[ <a href="mrm_band_update.php?id=' . $info["id"] . '">Edit</a> | <a href="mrm_band_delete.php?id=' . $info["id"] . '">Delete</a> ] <p>';
    }
    echo '</ol>';
}

function winner_banner()
{
    $query = "SELECT * FROM mrm_matches WHERE id=63";
    $result = mysqli_query(open_db(), $query);

    if (!$result) {
        echo "error: " . $query;
        die('Invalid');
    }
    $info = mysqli_fetch_assoc($result);

    echo "<div class=\"center\"><h2>Congratulations to your " . date('Y') . " <br>Y-Not Modern Rock Madness Champions</h2><h1>" . band_name($info['winner_id']) . "!</h1>" .
    '<img src="' . get_band_pic_url($info['winner_id']) . '" height="200px"></div>';
}
