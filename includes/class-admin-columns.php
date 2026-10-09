<?php
/**
 * Admin Columns (free and Pro) builds the media list's columns itself: a plugin's own column only
 * shows up there when it is registered as a column type. This one shows the label like the plugin's
 * column; with Pro it also sorts, filters (smart filter), edits inline and in bulk, and exports.
 * Written against Admin Columns 6 (ac/column_types); other major versions are left alone.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers the column type.
 */
class AI_Act_Labels_Admin_Columns {

	const TYPE = 'column-ai_act_label';

	/** Hooks into Admin Columns. */
	public static function init() {
		add_action( 'ac/column_types', array( __CLASS__, 'register' ) );
	}

	/**
	 * Registers the column type for the media list.
	 *
	 * @param object $list_screen Admin Columns' list screen.
	 */
	public static function register( $list_screen ) {
		if ( ! is_object( $list_screen ) || ! method_exists( $list_screen, 'get_group' ) || ! method_exists( $list_screen, 'register_column_type' ) || 'media' !== $list_screen->get_group() || ! class_exists( '\AC\Column' ) ) {
			return;
		}
		try {
			require_once AI_ACT_LABELS_DIR . 'includes/admin-columns/class-ac-column.php';
			$pro = interface_exists( '\ACP\Editing\Service' ) && interface_exists( '\ACP\Sorting\Sortable' ) && interface_exists( '\ACP\Search\Searchable' ) && interface_exists( '\ACP\Export\Service' ) && class_exists( '\ACP\Search\Comparison\Meta\Select' ) && class_exists( '\ACP\Sorting\Model\Post\Meta' );
			if ( $pro ) {
				require_once AI_ACT_LABELS_DIR . 'includes/admin-columns/class-acp-editing.php';
				require_once AI_ACT_LABELS_DIR . 'includes/admin-columns/class-acp-export.php';
				require_once AI_ACT_LABELS_DIR . 'includes/admin-columns/class-acp-column.php';
				$list_screen->register_column_type( new AI_Act_Labels_ACP_Column() );
			} else {
				$list_screen->register_column_type( new AI_Act_Labels_AC_Column() );
			}
		} catch ( \Throwable $e ) {
			return;
		}
	}
}
