<?php
/**
 * The column type with Admin Columns Pro: sorting, the smart filter, editing inline and in bulk, export.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * KI-Kennzeichnung (AI Act) in Admin Columns Pro.
 */
class AI_Act_Labels_ACP_Column extends AI_Act_Labels_AC_Column implements \ACP\Editing\Editable, \ACP\Sorting\Sortable, \ACP\Search\Searchable, \ACP\Export\Exportable {

	/**
	 * Editing: the four states as a select.
	 *
	 * @return \ACP\Editing\Service
	 */
	public function editing() {
		return new AI_Act_Labels_ACP_Editing();
	}

	/**
	 * Sorting by the decision.
	 *
	 * @return \ACP\Sorting\AbstractModel
	 */
	public function sorting() {
		return new \ACP\Sorting\Model\Post\Meta( AI_Act_Labels::META );
	}

	/**
	 * The smart filter: is, is not, empty (no decision), not empty.
	 *
	 * @return \ACP\Search\Comparison
	 */
	public function search() {
		$labels = AI_Act_Labels_Media::state_labels();
		unset( $labels[''] );
		return new \ACP\Search\Comparison\Meta\Select( AI_Act_Labels::META, 'post', $labels );
	}

	/**
	 * Export: the decision in words.
	 *
	 * @return \ACP\Export\Service
	 */
	public function export() {
		return new AI_Act_Labels_ACP_Export();
	}
}
