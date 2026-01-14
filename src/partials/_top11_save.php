<?php
// filepath: /workspaces/site/src/partials/_top11_save.php

// Get the Top11 model if not already available
if (!isset($top11Model)) {
    require_once ("models/Top11Factory.php");
    $db = open_db();
    $top11Model = \YNotRadio\Models\Top11Factory::create($db);
}

// Process the form submission
$firstname = isset($_POST['firstname']) ? $_POST['firstname'] : '';
$lastname = isset($_POST['lastname']) ? $_POST['lastname'] : '';
$phone = isset($_POST['phone']) ? $_POST['phone'] : '';

// Email comes from Auth0
$voter_email = isset($_POST['voter_email']) ? $_POST['voter_email'] : '';
$auth0_id = isset($_POST['auth0_id']) ? $_POST['auth0_id'] : null;
$email = $voter_email;

$contest = isset($_POST['contest']) ? $_POST['contest'] : 'no';
$newsletter = isset($_POST['newsletter']) ? $_POST['newsletter'] : 'no';
$top11_votes = isset($_POST['top11']) ? $_POST['top11'] : [];
$write_in = isset($_POST['write_in_value']) ? $_POST['write_in_value'] : '';

// Validate the form
$errors = [];

// Auth voting mode: require login
if (empty($voter_email)) {
    $errors[] = "You must be logged in to vote";
}

// Validate email format for auth voting
if (!empty($voter_email) && strpos($voter_email, '@') === false) {
    $errors[] = "Invalid email address format";
}

// Check for duplicate voting
if (!empty($voter_email) && $top11Model->hasUserVotedThisWeek($voter_email, $auth0_id)) {
    $errors[] = "You have already voted this week. Please come back next week!";
}

// Only require song selection, make personal info optional
if (empty($top11_votes) && empty($write_in)) {
    $errors[] = "Please select at least one song or write in your own";
}

// Display errors if any
if (!empty($errors)) {
    echo "<div class=\"alert alert-error\">";
    echo "<h3>Please correct the following errors:</h3>";
    echo "<ul>";
    foreach ($errors as $error) {
        echo "<li>$error</li>";
    }
    echo "</ul>";
    echo "</div>";
    return;
}

// Save the vote
try {
    // Auth voting mode: record user vote to prevent duplicates
    $voteRecorded = $top11Model->recordUserVote($voter_email, $auth0_id);
    if (!$voteRecorded) {
        throw new \Exception("Failed to record user vote - please try again");
    }
    
    // Save contestant info if provided
    // Use firstname from form, email from Auth0
    $contestantFirstname = !empty($firstname) ? $firstname : '';
    $contestantEmail = $email;
    
    if (!empty($contestantFirstname) || $contest === 'yes' || $newsletter === 'yes') {
        $top11Model->addContestant($contestantFirstname, $lastname, $contestantEmail, $phone, $contest, $newsletter);
    }
    
    // Process votes
    if (!empty($top11_votes)) {
        foreach ($top11_votes as $songId) {
            $top11Model->addVote($songId);
        }
    }
    
    // Process write-in
    if (!empty($write_in)) {
        $top11Model->addWriteIn($write_in);
    }
    
    // Display success message
    echo "<div class=\"alert alert-success\">";
    echo "<h3>Thank you for your vote!</h3>";
    echo "<p>Your Top 11 @ 11 vote has been received.</p>";
    echo "<p>You are logged in as: <strong>" . htmlspecialchars($voter_email) . "</strong></p>";
    if ($contest === 'yes') {
        echo "<p>You have been entered into this week's contest.</p>";
    }
    if ($newsletter === 'yes') {
        echo "<p>You have been added to our newsletter list.</p>";
    }
    echo "<p><a href=\"auth_logout.php?returnTo=/top11\">Log out</a></p>";
    echo "</div>";
} catch (\Exception $e) {
    // Log the error details server-side
    error_log("Top11 vote processing error: " . $e->getMessage());
    echo "<div class=\"alert alert-error\">";
    echo "<h3>Error</h3>";
    echo "<p>There was an error processing your vote. Please try again later.</p>";
    echo "</div>";
}
