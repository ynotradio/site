# Auth0 Authentication System

This directory contains a unified Auth0 authentication system for all voting features.

## Generic Handlers

### `auth_login.php`
Generic login handler that accepts a `returnTo` parameter.

**Usage:**
```php
<a href="auth_login.php?returnTo=/top11">Log in to Vote</a>
<a href="auth_login.php?returnTo=/madness">Log in to Vote</a>
<a href="auth_login.php?returnTo=/yearendpoll">Log in to Vote</a>
```

### `auth_logout.php`
Generic logout handler that accepts a `returnTo` parameter.

**Usage:**
```php
<a href="auth_logout.php?returnTo=/top11">Log out</a>
<a href="auth_logout.php?returnTo=/madness">Log out</a>
<a href="auth_logout.php?returnTo=/yearendpoll">Log out</a>
```

**Features:**
- Clears local PHP session
- Performs federated logout at Auth0
- Redirects user back to specified page

## Implementation

These generic handlers are used directly throughout the codebase:

- **Top 11 @ 11**: `top11.php` and `partials/_top11_save.php`
- **Modern Rock Madness**: `partials/_mrm_vote_form.php` and `partials/_footer.php`
- **Year End Poll**: (To be implemented)

## Auth0 Configuration Required

In the Auth0 dashboard, ensure these URLs are configured:

**Allowed Callback URLs:**
```
https://www.ynotradio.net/top11
https://www.ynotradio.net/madness
https://www.ynotradio.net/yearendpoll
```

**Allowed Logout URLs:**
```
https://www.ynotradio.net/top11
https://www.ynotradio.net/madness
https://www.ynotradio.net/yearendpoll
https://www.ynotradio.net/
```

## Security

The handlers validate that `returnTo` is a relative path (starts with `/`) to prevent open redirect vulnerabilities.

