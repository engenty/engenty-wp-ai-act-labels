<?php
/**
 * Editing the label from Admin Columns Pro, inline and in bulk.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * Editing a label from the list.
 */
class AI_Act_Labels_ACP_Editing implements \ACP\Editing\Service {

	/**
	 * A select with the four states.
	 *
	 * @param string $context single or bulk.
	 * @return \ACP\Editing\View|null
	 */
	public function get_view( string $context ): ?\ACP\Editing\View {
		unset( $context );
		return new \ACP\Editing\View\Select( AI_Act_Labels_Media::state_labels() );
	}

	/**
	 * The decision.
	 *
	 * @param int $id Attachment ID.
	 * @return string
	 */
	public function get_value( int $id ) {
		return AI_Act_Labels::get( $id );
	}

	/**
	 * Saves the decision.
	 *
	 * @param int   $id   Attachment ID.
	 * @param mixed $data generated, modified, none or ''.
	 */
	public function update( int $id, $data ): void {
		if ( current_user_can( 'edit_post', $id ) && 'file' !== AI_Act_Labels::media_type( $id ) ) {
			AI_Act_Labels::set( $id, AI_Act_Labels::one_of( (string) $data, array_merge( AI_Act_Labels::STATES, array( '' ) ), '' ), 'manual' );
		}
	}
}
