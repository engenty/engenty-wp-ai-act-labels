<?php
/**
 * The tests run inside a real WordPress with the plugin active (the SQLite one of bin/test-site.sh will do):
 *   WP_PATH=/path/to/wordpress vendor/bin/phpunit
 *
 * @package AI_Act_Labels
 */

$ai_act_labels_wp = getenv( 'WP_PATH' );
if ( ! $ai_act_labels_wp || ! file_exists( $ai_act_labels_wp . '/wp-load.php' ) ) {
	fwrite( STDERR, "WP_PATH must point to a WordPress with the plugin active.\n" );
	exit( 1 );
}
$_SERVER['HTTP_HOST']   = $_SERVER['HTTP_HOST'] ?? 'localhost';
$_SERVER['REMOTE_ADDR'] = '203.0.113.7';
define( 'WP_USE_THEMES', false );
require $ai_act_labels_wp . '/wp-load.php';
if ( ! class_exists( 'AI_Act_Labels' ) ) {
	fwrite( STDERR, "The plugin is not active in that WordPress.\n" );
	exit( 1 );
}
require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/post.php';
require __DIR__ . '/../fixtures/files.php';
require __DIR__ . '/TestCase.php';
