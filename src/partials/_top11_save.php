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
$email = isset($_POST['email']) ? $_POST['email'] : '';
$phone = isset($_POST['phone']) ? $_POST['phone'] : '';
$contest = isset($_POST['contest']) ? $_POST['contest'] : 'no';
$newsletter = isset($_POST['newsletter']) ? $_POST['newsletter'] : 'no';
$top11_votes = isset($_POST['top11']) ? $_POST['top11'] : [];
$write_in = isset($_POST['write_in_value']) ? $_POST['write_in_value'] : '';

// Validate the form
$errors = [];
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

// Save the contestant
try {
    // Only save contestant info if they provided at least a name and email
    if (!empty($firstname) && !empty($email)) {
        $top11Model->addContestant($firstname, $lastname, $email, $phone, $contest, $newsletter);
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
    if ($contest === 'yes') {
        echo "<p>You have been entered into this week's contest.</p>";
    }
    if ($newsletter === 'yes') {
        echo "<p>You have been added to our newsletter list.</p>";
    }
    echo "</div>";
} catch (\Exception $e) {
    echo "<div class=\"alert alert-error\">";
    echo "<h3>Error</h3>";
    echo "<p>There was an error processing your vote. Please try again later.</p>";
    echo "</div>";
}
