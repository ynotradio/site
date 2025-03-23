<?php
/**
 * Modern Rock Madness Admin Page
 * 
 * Administrative tools for Modern Rock Madness Tournament
 */

// Include required files
require_once 'partials/__env_loader.php';
require_once 'functions/main_fns.php';
require_once 'partials/_mrm_config.php';

// Check authentication
session_start();
if (!isset($_SESSION['valid_user'])) {
    // Not logged in, redirect to login page
    header('Location: cp.php');
    exit;
}

// Page title
$page_title = "MRM Admin";

// Include header
include('partials/_header.php');
?>

<div class="container">
    <h1>Modern Rock Madness Administration</h1>
    
    <div class="panel">
        <h2>Tournament Information</h2>
        <p><strong>Tournament Year:</strong> <?php echo date('Y', strtotime($madness_start_date)); ?></p>
        <p><strong>Start Date:</strong> <?php echo date('F j, Y', strtotime($madness_start_date)); ?></p>
    </div>
    
    <div class="panel">
        <h2>Administrative Actions</h2>
        
        <div class="action-item">
            <h3>Database Reset</h3>
            <p>Generate a SQL file that will reset the tournament database tables and create match dates based on the configured start date.</p>
            <a href="functions/mrm_reset_generator.php" class="button">Generate Reset SQL</a>
            <p class="warning">Warning: Please backup your database before running any generated SQL!</p>
        </div>
        
        <div class="action-item">
            <h3>View Tournament</h3>
            <p>Preview the tournament bracket (works even before the start date).</p>
            <a href="madness.php?preview=1" class="button">Preview Tournament</a>
        </div>
        
        <div class="action-item">
            <h3>Manage Matches</h3>
            <p>View and update tournament matches.</p>
            <a href="mrm_manage_matches.php" class="button">Manage Matches</a>
        </div>
        
        <div class="action-item">
            <h3>Manage Bands</h3>
            <p>View and update bands participating in the tournament.</p>
            <a href="mrm_view_all.php" class="button">Manage Bands</a>
        </div>
    </div>
</div>

<style>
.panel {
    background: #f5f5f5;
    padding: 15px 20px;
    margin-bottom: 20px;
    border-radius: 4px;
    border: 1px solid #ddd;
}

.action-item {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.action-item:last-child {
    border-bottom: none;
}

.button {
    display: inline-block;
    padding: 8px 15px;
    background: #0078e7;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin-right: 10px;
}

.button:hover {
    background: #0053a3;
}

.warning {
    color: #a94442;
    font-style: italic;
    margin-top: 10px;
}
</style>

<?php
// Include footer
include('partials/_footer.php');
?>