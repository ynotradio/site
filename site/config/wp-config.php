<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'ynotradio_dev');

/** MySQL database username */
define('DB_USER', 'root');

/** MySQL database password */
define('DB_PASSWORD', 'root');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8mb4');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'lf(35Zz2b;Ki6i@v_U=D#P7dFO,iCt,|MPGW2(J)lGqpNlD$HFV{gcZ_uz>x_rzK');
define('SECURE_AUTH_KEY',  '^1N0Xxr1nI1J.pMkStAfwiM~*AA#+SqowS/z//i5kBJt ~?1{wCNMN<fuI8E;;rT');
define('LOGGED_IN_KEY',    'ig+xdj(o@uotTx:>t{llC#QGUEM-;Y}NJf0myCOE0?_h4(Ee~lxPJZ!k[%/t}kK2');
define('NONCE_KEY',        'L,5.FyA$RLT]jKdVe&-P@@2zj#kuPcCH`g5@hpsbhqTc@`KDQQD3I0!u:Guf=3cw');
define('AUTH_SALT',        '-9t~c?b@6_b_MQPWY;MHJODpO([Atu%n2Ca{V~D.xtdL8t2kuwC8i#&S{>H4WB]H');
define('SECURE_AUTH_SALT', 'Y&!v!^zQ|E7U*jTr& iOoT{kOZ8WcO~yP*091`cN8W&ooAjf3lI2)K7){#;5XsgV');
define('LOGGED_IN_SALT',   'WkSrx$kY<ihCmFaYN];(=&:{FvBg5;/R*N;51VC5T|I`Ex4PZRR;S=Kf{S5*L^3H');
define('NONCE_SALT',       'C2`GtI!74npMP_piROo_]EB7VTf [I+A$@gR-EW{/F@}5ig?V<(~8&HB)wgdbT~o');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', true);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
