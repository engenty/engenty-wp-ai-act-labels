<?php
/**
 * The label in Admin Columns Pro's export.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * The decision in words, for the export.
 */
class AI_Act_Labels_ACP_Export implements \ACP\Export\Service {

	/**
	 * The value.
	 *
	 * @param int $id Attachment ID.
	 * @return string
	 */
	public function get_value( $id ) {
		$state = AI_Act_Labels::get( (int) $id );
		return '' === $state ? '' : ( AI_Act_Labels_Media::state_labels()[ $state ] ?? $state );
	}
}
