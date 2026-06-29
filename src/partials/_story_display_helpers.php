<?php
// Helper functions for displaying stories, maintained for compatibility
// These could be integrated into templates in a future update

function display_pic($pic_url, $pic_img)
{
  if ($pic_url == "top11.php") {
    echo "<a href= \"" . $pic_url . "\" ><img src=\"" . $pic_img . "\"></a>\n";
  } else {
    echo "<a href= \"" . $pic_url . "\" target=\"_blank\" rel=\"noopener noreferrer\"><img src=\"" . $pic_img . "\"></a>\n";
  }
}

/**
 * Format headline with hard line breaks after colon
 * Inserts <br> after colons to force consistent line breaking.
 * This ensures labels like "Top 11 @ 11:" always stand on their own line.
 */
function format_headline_with_breaks($headline)
{
  // Insert hard line break after colon followed by space
  $headline = preg_replace('/:\s+/', ":<br>", $headline);
  return $headline;
}

/**
 * Render a list of stories.
 *
 * Each `.feature-box` is emitted with an inline `style="order:N"` so that
 * when the wrapping `.stories-container` collapses its column wrappers via
 * `display: contents` on mobile, flex `order` interleaves stories from the
 * two priority groups back into strict priority sequence (1, 2, 3, …).
 *
 * @param array $stories      Stories to render (in the order they should
 *                            appear within their column on desktop).
 * @param int   $order_start  CSS `order` value for the first story.
 * @param int   $order_step   Increment applied to subsequent stories.
 */
function display_stories($stories, $order_start = 0, $order_step = 1)
{
  for ($i = 0; $i < sizeof($stories); $i++) {
    $info = $stories[$i];
    $formatted_headline = format_headline_with_breaks($info['headline']);
    // Add 'long-headline' class for headlines longer than 35 characters
    $headlineClass = strlen($info['headline']) > 35 ? ' class="long-headline"' : '';
    $order = $order_start + ($i * $order_step);
    $priority = isset($info['priority']) ? (int) $info['priority'] : '';
    echo "<div class=\"feature-box\" style=\"order:{$order}\" data-priority=\"{$priority}\">" .
      "<h3{$headlineClass}>" . $formatted_headline . "</h3>\n";
    display_pic($info['pic_url'], $info['pic']);
    echo "<div class=\"clearfix\">" . $info['story'] . "</div>\n</div>";
  }
}

function display_story($story)
{
  echo "<br><b>Headline: </b>" . $story['headline'] .
    "<br><b>Story: </b>" . $story['story'] .
    "<br><b>Start Date: </b>" . $story['start_date'] .
    "<br><b>End Date: </b>" . $story['end_date'] .
    "<br><b>Picture URL: </b>" . $story['pic'] .
    "<br><b>Picture Link URL: </b>" . $story['pic_url'] .
    "<br><b>Priority: </b>" . $story['priority'];
}
