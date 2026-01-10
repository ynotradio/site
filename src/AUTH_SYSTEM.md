# Auth0 Authentication System

This directory contains a unified Auth0 authentication system for all voting features.

## Generic Handlers

### `auth_login.php`
Generic login handler that accepts a `returnTo` parameter.

**Usage:**
```
/auth_login.php?returnTo=/top11
/auth_login.php?returnTo=/madness
/auth_login.php?returnTo=/yearendpoll
```

### `auth_logout.php`
Generic logout handler that accepts a `returnTo` parameter.

**Usage:**
```
/auth_logout.php?returnTo=/top11
/auth_logout.php?returnTo=/madness
/auth_logout.php?returnTo=/yearendpoll
```

**Features:**
- Clears local PHP session
- Performs federated logout at Auth0
- Redirects user back to specified page

## Feature-Specific Redirects

For backward compatibility and easier linking, feature-specific files redirect to the generic handlers:

- `top11_social_login.php` → `auth_login.php?returnTo=/top11`
- `top11_social_logout.php` → `auth_logout.php?returnTo=/top11`
- `social_login.php` (MRM) → `auth_login.php?returnTo=/madness`
- `social_logout.php` (MRM) → `auth_logout.php?returnTo=/madness`

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
