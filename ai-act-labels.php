<?php
/**
 * Plugin Name:       AI Act Labels
 * Plugin URI:        https://engenty.ai/ai-act-labels
 * Description:       Marks AI-generated and AI-modified media as the EU AI Act asks – right in the media library, with the EU's official icons on the site, and an assistant that finds what needs a label.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      8.1
 * Author:            engenty
 * Author URI:        https://engenty.ai
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ai-act-labels
 * Domain Path:       /languages
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

define( 'AI_ACT_LABELS_VERSION', '0.1.0' );
define( 'AI_ACT_LABELS_FILE', __FILE__ );
define( 'AI_ACT_LABELS_DIR', plugin_dir_path( __FILE__ ) );
define( 'AI_ACT_LABELS_URL', plugin_dir_url( __FILE__ ) );

require_once AI_ACT_LABELS_DIR . 'includes/class-icons.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-labels.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-detect.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-usage.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-front.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-media.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-assistant.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-rest.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-admin.php';
require_once AI_ACT_LABELS_DIR . 'includes/class-admin-columns.php';

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once AI_ACT_LABELS_DIR . 'includes/class-cli.php';
}

/**
 * Whether a media file carries an AI label: `generated` or `modified`, false when not.
 * For themes that print images themselves, together with ai_act_labels_wrap().
 *
 * @param int $attachment_id Attachment ID.
 * @return string|false
 */
function ai_act_labels_kind( $attachment_id ) {
	$kind = AI_Act_Labels::kind( (int) $attachment_id );
	return $kind ? $kind : false;
}

/**
 * The notice of a labelled media file („Dieses Bild wurde mit KI erzeugt.“), empty when it has no label.
 *
 * @param int $attachment_id Attachment ID.
 * @return string
 */
function ai_act_labels_notice( $attachment_id ) {
	return AI_Act_Labels::kind( (int) $attachment_id ) ? AI_Act_Labels::notice( (int) $attachment_id ) : '';
}

/**
 * Puts the label on image markup a theme prints itself (a raw `<img>`, a picture element).
 * Images from wp_get_attachment_image() and the editor's blocks get it without this.
 *
 * @param string $html          The markup.
 * @param int    $attachment_id Attachment ID.
 * @param bool   $has_caption   True when a visible caption already carries the notice: the icon is then decorative for screen readers.
 * @return string
 */
function ai_act_labels_wrap( $html, $attachment_id, $has_caption = false ) {
	return AI_Act_Labels_Front::wrap( (string) $html, (int) $attachment_id, (bool) $has_caption );
}

/**
 * Adds the notice to a caption or credit line a theme prints itself: „Foto: Anna, Dieses Bild wurde mit KI erzeugt.“
 * An empty text stays empty – no new caption appears.
 *
 * @param string $text          The caption.
 * @param int    $attachment_id Attachment ID.
 * @return string
 */
function ai_act_labels_append_notice( $text, $attachment_id ) {
	return AI_Act_Labels_Front::append_notice( (string) $text, (int) $attachment_id );
}

register_activation_hook(
	__FILE__,
	static function () {
		// The tool opens once after activation.
		set_transient( 'ai_act_labels_activated', 1, 60 );
	}
);

// The scripts' strings follow the same rule.
add_filter(
	'load_script_translation_file',
	static function ( $file, $handle, $domain ) {
		if ( 'ai-act-labels' !== $domain || ( $file && is_readable( $file ) ) || str_starts_with( determine_locale(), 'de' ) ) {
			return $file;
		}
		$fallback = $file ? preg_replace( '/-[a-z]{2,3}(_[A-Z]{2})?(_[a-z]+)?-([0-9a-f]{32})\.json$/', '-en_US-$3.json', $file ) : '';
		return $fallback && is_readable( $fallback ) ? $fallback : $file;
	},
	10,
	3
);

add_action(
	'plugins_loaded',
	static function () {
		// The plugin speaks German; every other language without its own translation gets English.
		if ( ! load_plugin_textdomain( 'ai-act-labels', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' ) && ! str_starts_with( determine_locale(), 'de' ) ) {
			load_textdomain( 'ai-act-labels', AI_ACT_LABELS_DIR . 'languages/ai-act-labels-en_US.mo' );
		}
		AI_Act_Labels_Front::init();
		AI_Act_Labels_Media::init();
		AI_Act_Labels_Rest::init();
		AI_Act_Labels_Admin::init();
		AI_Act_Labels_Admin_Columns::init();
	}
);
