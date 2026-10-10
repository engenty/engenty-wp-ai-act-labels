<?php
/**
 * `wp ai-act-image-labels`: the check, labels and lists from the command line.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * Labels AI media from WP-CLI.
 */
class AI_Act_Labels_CLI {

	/**
	 * Runs the whole check: where media is used, traces of AI in files.
	 *
	 * ## OPTIONS
	 *
	 * [--files]
	 * : Read traces in files that were read before, too.
	 *
	 * @param array $args       Arguments.
	 * @param array $assoc_args Options.
	 */
	public function scan( $args, $assoc_args ) {
		unset( $args );
		$progress = AI_Act_Labels_Usage::step( true, ! empty( $assoc_args['files'] ) );
		while ( 'done' !== $progress['phase'] ) {
			$progress = AI_Act_Labels_Usage::step();
		}
		AI_Act_Labels_Front::forget();
		$counts = AI_Act_Labels::counts();
		WP_CLI::success( sprintf( 'Checked. Labelled: %d generated, %d modified. Suggestions: %d. Used, not decided: %d.', $counts['generated'], $counts['modified'], $counts['suggested'], $counts['unchecked'] ) );
	}

	/**
	 * Decides on media files.
	 *
	 * ## OPTIONS
	 *
	 * <id>...
	 * : Attachment IDs.
	 *
	 * --as=<state>
	 * : generated, modified, none or clear.
	 *
	 * [--tool=<tool>]
	 * : The AI tool.
	 *
	 * @param array $args       IDs.
	 * @param array $assoc_args Options.
	 */
	public function label( $args, $assoc_args ) {
		$state = 'clear' === $assoc_args['as'] ? '' : (string) $assoc_args['as'];
		if ( ! in_array( $state, array_merge( AI_Act_Labels::STATES, array( '' ) ), true ) ) {
			WP_CLI::error( 'Use generated, modified, none or clear.' );
		}
		$extra = isset( $assoc_args['tool'] ) ? array( 'tool' => (string) $assoc_args['tool'] ) : array();
		foreach ( $args as $id ) {
			if ( AI_Act_Labels::set( (int) $id, $state, 'manual', $extra ) ) {
				WP_CLI::log( $id . ': ' . ( '' === $state ? 'cleared' : $state ) );
			} else {
				WP_CLI::warning( $id . ': not an attachment' );
			}
		}
	}

	/**
	 * Lists media of a list of the tool.
	 *
	 * ## OPTIONS
	 *
	 * [--filter=<filter>]
	 * : suggested, unchecked, undecided, labelled, generated, modified, none, all.
	 * ---
	 * default: labelled
	 * ---
	 *
	 * [--format=<format>]
	 * : table, json, csv.
	 * ---
	 * default: table
	 * ---
	 *
	 * @param array $args       Arguments.
	 * @param array $assoc_args Options.
	 */
	public function list( $args, $assoc_args ) {
		unset( $args );
		$rows = array();
		foreach ( AI_Act_Labels::query_ids( $assoc_args['filter'], -1 ) as $id ) {
			$d      = AI_Act_Labels::describe( $id, false );
			$rows[] = array(
				'id'       => $id,
				'file'     => $d['file'],
				'state'    => $d['state'],
				'suggests' => $d['suggests'],
				'traces'   => implode( '; ', array_column( (array) ( $d['signals']['items'] ?? array() ), 'label' ) ),
				'used'     => count( $d['usage'] ),
			);
		}
		WP_CLI\Utils\format_items( $assoc_args['format'], $rows, array( 'id', 'file', 'state', 'suggests', 'traces', 'used' ) );
	}

	/**
	 * Reads the traces of AI in one file.
	 *
	 * ## OPTIONS
	 *
	 * <id>
	 * : Attachment ID.
	 *
	 * @param array $args ID.
	 */
	public function detect( $args ) {
		WP_CLI::print_value( AI_Act_Labels_Detect::attachment( (int) $args[0] ), array( 'format' => 'json' ) );
	}
}

WP_CLI::add_command( 'ai-act-image-labels', 'AI_Act_Labels_CLI' );
