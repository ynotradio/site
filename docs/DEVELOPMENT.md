# Y-Not Radio Development Guide

This document provides context about the Y-Not Radio website project architecture, patterns, and conventions to help developers and AI assistants better understand the codebase.

## Project Overview

- PHP-based web application for Y-Not Radio, a Philadelphia-based radio station
- Manages radio content, DJs, music reviews, concerts, and special events like "Modern Rock Madness"
- Legacy application being incrementally modernized

## Technology Stack

- **Backend**: PHP (with mixed PHP/HTML templates)
- **Database**: MySQL
- **Development Environment**: Docker (Bitnami LAMP stack)
- **Authentication**: 
  - Legacy session-based auth for admin area
  - Auth0 for newer features
- **Package Management**: Composer

## Code Structure

- `/src` - Main application files
- `/src/functions` - Core functionality modules
  - `main_fns.php` - Core utility functions
  - `[feature]_fns.php` - Feature-specific functions (e.g., `music_fns.php`)
- `/src/partials` - Template components and UI parts
  - `_header.php`, `_footer.php` - Common page elements
  - `_[feature]_form.php` - Form templates for various features
- `/src/ext` - Legacy include files (being migrated to `/functions`)
- `/db` - Database setup and migrations

## Application Architecture

### Common Page Structure

Most PHP files follow this general pattern:

```php
<?php
$page_file = "page_name.php";  // Current file for navigation highlighting
$page_title = "Page Title";     // Browser title and main heading

// Include required functions and header
require ("functions/main_fns.php");
require ("functions/feature_fns.php");
require ("partials/_header.php");

// Authentication check for admin pages
if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username], $_POST[remember_me], $_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <!-- Page Content -->
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div>
<?php
}
require ("partials/_footer.php");
?>
```

### Database Patterns

The site uses two methods for database access:

1. **Legacy**: `open_db()` to get a database connection
2. **Modern**: Singleton `Database` class with utility functions

```php
// Legacy style
$db = open_db();
$result = mysqli_query($db, $query);

// Modern style
$db = Database::getInstance();
$user = db_get_row("SELECT * FROM users WHERE id = ?", [1]);
```

## Key Features

### Administrative Control Panel

- Entry point: `cp.php`
- Requires authentication via `$_SESSION["logged_in"]`
- Contains links to all management features

### Modern Rock Madness (MRM)

- Annual tournament feature
- Configuration in `partials/_mrm_config.php`
- Admin tools in `mrm_*.php` files
- Public-facing tournament bracket in `madness.php`

### Top 11 @ 11

- Music voting system and playlist manager
- Features voting, statistics, and reporting

### Content Management

- Stories (`story_*.php`) - News and articles
- Concerts (`concert_*.php`) - Event listings 
- CD of the Week (`cdotw_*.php`) - Music reviews
- DJ Profiles (`deejay_*.php`) - Staff information
- On Demand (`ondemand_*.php`) - Archived shows

## Development Environment

### Setup Options

1. **GitHub Codespaces** (Recommended)
   - Environment configured in `.devcontainer`
   - Auto-forwarded ports for web and database access

2. **Local Docker Development**
   - Requires Docker and Docker Compose
   - Command: `docker-compose up`
   - Web: http://localhost:8080
   - PHPMyAdmin: http://localhost:8181

### Environment Configuration

- Copy `src/partials/.env.example` to `src/partials/.env`
- Configure database and Auth0 credentials
- Docker environment variables in `docker-compose.yml`

## Common Development Tasks

### Adding a New Feature

1. Create function file in `/src/functions/[feature]_fns.php`
2. Create necessary admin pages following the naming patterns:
   - `[feature]_add.php` - Creation form
   - `[feature]_view_all.php` - Listing page
   - `[feature]_update.php` - Edit form
   - `[feature]_delete.php` - Deletion handler
3. Add public-facing page as needed
4. Add link to control panel in `cp.php`

### Database Migrations

- SQL files stored in `/db`
- Apply via PHPMyAdmin or command line
- Follow same table structure and naming conventions

## Code Style and Conventions

- Mixed HTML/PHP style with closing PHP tags
- Variables use snake_case naming
- Function names are descriptive of their purpose
- UI uses a 12-column grid system with "row" and "columns" classes
- Form validation typically happens server-side
- Most forms use POST method for data submission