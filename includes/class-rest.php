<?php
/**
 * REST routes of the tool (`ai-act-labels/v1`): state, lists, labels, settings, the check, the
 * assistant, the preview of the label.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * The tool's API.
 */
class AI_Act_Labels_Rest {

	const NS = 'ai-act-labels/v1';

	/** Registers the routes. */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	/** The routes. */
	public static function routes() {
		$media    = static fn() => current_user_can( 'upload_files' );
		$settings = static fn() => current_user_can( 'manage_options' );
		$routes   = array(
			'/state'             => array( 'GET', 'state', $media ),
			'/media'             => array( 'GET', 'media', $media ),
			'/media/(?P<id>\d+)' => array( 'GET', 'one', $media ),
			'/label'             => array( 'POST', 'label', $media ),
			'/settings'          => array( 'POST', 'settings', $settings ),
			'/scan'              => array( 'POST', 'scan', $media ),
			'/review'            => array( 'POST', 'review', $media ),
			'/verify'            => array( 'POST', 'verify', $media ),
			'/assist'            => array( 'POST', 'assist', $media ),
			'/preview'           => array( 'POST', 'preview', $media ),
			'/accept'            => array( 'POST', 'accept', $media ),
			'/hide'              => array( 'POST', 'hide', $media ),
		);
		foreach ( $routes as $path => list( $method, $callback, $permission ) ) {
			register_rest_route(
				self::NS,
				$path,
				array(
					'methods'             => $method,
					'callback'            => array( __CLASS__, $callback ),
					'permission_callback' => $permission,
				)
			);
		}
	}

	/**
	 * Everything the tool starts with.
	 *
	 * @return array
	 */
	public static function state() {
		$wizards = 'engenty-wizards/engenty-wizards.php';
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		return array(
			'settings'    => AI_Act_Labels::settings(),
			'defaults'    => array(
				'generated'       => __( 'AI-generated', 'ai-act-labels' ),
				'modified'        => __( 'Modified with AI', 'ai-act-labels' ),
				'noticeGenerated' => __( 'This image was created with AI.', 'ai-act-labels' ),
				'noticeModified'  => __( 'This image was modified with AI.', 'ai-act-labels' ),
			),
			'counts'      => AI_Act_Labels::counts(),
			'last'        => get_option( AI_Act_Labels_Usage::LAST, null ),
			'running'     => is_array( get_option( AI_Act_Labels_Usage::RUN ) ),
			'assistant'   => AI_Act_Labels_Assistant::status(),
			'canSettings' => current_user_can( 'manage_options' ),
			'hidden'      => array_values( array_filter( (array) get_user_meta( get_current_user_id(), 'ai_act_labels_hidden', true ) ) ),
			'custom'      => self::custom_icon(),
			'sample'      => self::sample(),
			'wizards'     => array(
				'installed' => file_exists( WP_PLUGIN_DIR . '/' . $wizards ),
				'active'    => is_plugin_active( $wizards ),
				'install'   => admin_url( 'plugin-install.php?s=' . rawurlencode( 'engenty wizards' ) . '&tab=search&type=term' ),
				'open'      => admin_url( 'admin.php?page=engenty-wizards' ),
			),
		);
	}

	/**
	 * The own icon, if one is set.
	 *
	 * @return array|null
	 */
	private static function custom_icon() {
		$id = AI_Act_Labels::settings()['custom'];
		return $id ? array(
			'id'  => $id,
			'url' => (string) wp_get_attachment_image_url( $id, 'thumbnail' ),
		) : null;
	}

	/**
	 * A picture for the preview: the newest labelled image, else the newest image.
	 *
	 * @return array|null
	 */
	private static function sample() {
		$ids = array_merge( AI_Act_Labels::query_ids( 'labelled', 5 ), AI_Act_Labels::query_ids( 'all', 10 ) );
		foreach ( $ids as $id ) {
			if ( 'image' === AI_Act_Labels::media_type( $id ) ) {
				return array(
					'id'  => $id,
					'url' => (string) wp_get_attachment_image_url( $id, 'large' ),
				);
			}
		}
		return null;
	}

	/**
	 * A list of media.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array
	 */
	public static function media( WP_REST_Request $request ) {
		$filter = sanitize_key( (string) ( $request['filter'] ?? 'suggested' ) );
		$search = sanitize_text_field( (string) ( $request['search'] ?? '' ) );
		$page   = max( 1, (int) ( $request['page'] ?? 1 ) );
		$per    = min( 60, max( 1, (int) ( $request['per'] ?? 24 ) ) );
		$args   = array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'post_mime_type' => array( 'image', 'video', 'audio' ),
			'posts_per_page' => $per,
			'paged'          => $page,
			'fields'         => 'ids',
			'orderby'        => 'date',
			'order'          => 'DESC',
		);
		$meta   = AI_Act_Labels::meta_query( $filter );
		if ( $meta ) {
			$args['meta_query'] = $meta; // phpcs:ignore WordPress.DB.SlowDBQuery
		}
		if ( '' !== $search ) {
			$args['s'] = $search;
		}
		$query = new WP_Query( $args );
		return array(
			'items' => array_map( static fn( $id ) => AI_Act_Labels::describe( (int) $id ), $query->posts ),
			'total' => (int) $query->found_posts,
			'page'  => $page,
			'pages' => (int) $query->max_num_pages,
		);
	}

	/**
	 * One media file.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array|WP_Error
	 */
	public static function one( WP_REST_Request $request ) {
		$id = (int) $request['id'];
		if ( 'attachment' !== get_post_type( $id ) ) {
			return new WP_Error( 'ai_act_labels_missing', __( 'This file does not exist.', 'ai-act-labels' ), array( 'status' => 404 ) );
		}
		return AI_Act_Labels::describe( $id );
	}

	/**
	 * Decides on files.
	 *
	 * @param WP_REST_Request $request `ids`, `state`, optional `tool`, `notice`.
	 * @return array|WP_Error
	 */
	public static function label( WP_REST_Request $request ) {
		$ids   = array_map( 'intval', (array) ( $request['ids'] ?? array() ) );
		$state = (string) ( $request['state'] ?? '' );
		if ( ! in_array( $state, array_merge( AI_Act_Labels::STATES, array( '' ) ), true ) ) {
			return new WP_Error( 'ai_act_labels_state', __( 'This label does not exist.', 'ai-act-labels' ), array( 'status' => 400 ) );
		}
		$extra = array();
		foreach ( array( 'tool', 'notice' ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$extra[ $key ] = (string) $request[ $key ];
			}
		}
		$via   = sanitize_key( (string) ( $request['via'] ?? 'manual' ) );
		$items = array();
		foreach ( array_slice( $ids, 0, 200 ) as $id ) {
			if ( ! current_user_can( 'edit_post', $id ) ) {
				continue;
			}
			AI_Act_Labels::set( $id, $state, in_array( $via, array( 'manual', 'bulk', 'assistant', 'metadata' ), true ) ? $via : 'manual', $extra );
			$items[] = AI_Act_Labels::describe( $id );
		}
		return array(
			'items'  => $items,
			'counts' => AI_Act_Labels::counts(),
		);
	}

	/**
	 * Saves settings.
	 *
	 * @param WP_REST_Request $request `patch`.
	 * @return array
	 */
	public static function settings( WP_REST_Request $request ) {
		$patch = (array) ( $request['patch'] ?? array() );
		AI_Act_Labels::save_settings( $patch );
		AI_Act_Labels_Front::forget();
		return self::state();
	}

	/**
	 * One step of the check.
	 *
	 * @param WP_REST_Request $request `restart`, `files`.
	 * @return array
	 */
	public static function scan( WP_REST_Request $request ) {
		$progress = AI_Act_Labels_Usage::step( (bool) $request['restart'], (bool) $request['files'] );
		if ( 'done' === $progress['phase'] ) {
			AI_Act_Labels_Front::forget();
			$progress['counts'] = AI_Act_Labels::counts();
			$progress['last']   = get_option( AI_Act_Labels_Usage::LAST, null );
		}
		return $progress;
	}

	/**
	 * The assistant's assessment of one file.
	 *
	 * @param WP_REST_Request $request `id`.
	 * @return array|WP_Error
	 */
	public static function review( WP_REST_Request $request ) {
		$id   = (int) $request['id'];
		$hint = AI_Act_Labels_Assistant::review( $id );
		if ( is_wp_error( $hint ) ) {
			return $hint;
		}
		return array(
			'hint'   => $hint,
			'item'   => AI_Act_Labels::describe( $id ),
			'counts' => AI_Act_Labels::counts(),
		);
	}

	/**
	 * Opens the pages of a file and looks for its label.
	 *
	 * @param WP_REST_Request $request `id`.
	 * @return array
	 */
	public static function verify( WP_REST_Request $request ) {
		$id = (int) $request['id'];
		return array(
			'result' => AI_Act_Labels_Usage::verify( $id ),
			'item'   => AI_Act_Labels::describe( $id ),
		);
	}

	/**
	 * One turn of the chat.
	 *
	 * @param WP_REST_Request $request `message`, `history`, `focus`.
	 * @return array|WP_Error
	 */
	public static function assist( WP_REST_Request $request ) {
		$message = sanitize_textarea_field( (string) ( $request['message'] ?? '' ) );
		if ( '' === trim( $message ) ) {
			return new WP_Error( 'ai_act_labels_empty', __( 'Write a question.', 'ai-act-labels' ), array( 'status' => 400 ) );
		}
		if ( ! AI_Act_Labels_Assistant::status()['ready'] ) {
			return new WP_Error( 'ai_act_labels_no_provider', __( 'For this, WordPress needs an AI provider (Settings › Connectors).', 'ai-act-labels' ), array( 'status' => 409 ) );
		}
		return AI_Act_Labels_Assistant::ask( $message, (array) ( $request['history'] ?? array() ), array_map( 'intval', (array) ( $request['focus'] ?? array() ) ) );
	}

	/**
	 * Takes over every suggestion: each file gets the label its traces or the assessment suggest.
	 *
	 * @return array `done` (id, state), `counts`.
	 */
	public static function accept() {
		$done = array();
		foreach ( AI_Act_Labels::query_ids( 'suggested', 500 ) as $id ) {
			$state = AI_Act_Labels::suggestion( $id );
			if ( in_array( $state, AI_Act_Labels::KINDS, true ) && current_user_can( 'edit_post', $id ) && AI_Act_Labels::set( $id, $state, 'bulk' ) ) {
				$done[] = array(
					'id'    => $id,
					'state' => $state,
				);
			}
		}
		return array(
			'done'   => $done,
			'counts' => AI_Act_Labels::counts(),
		);
	}

	/**
	 * Hides a notice of the tool for this person, or shows it again.
	 *
	 * @param WP_REST_Request $request `key`, `hidden`.
	 * @return array `hidden`.
	 */
	public static function hide( WP_REST_Request $request ) {
		$key    = sanitize_key( (string) $request['key'] );
		$hidden = (array) get_user_meta( get_current_user_id(), 'ai_act_labels_hidden', true );
		$hidden = array_values( array_diff( array_filter( $hidden ), array( $key ) ) );
		if ( false !== $request['hidden'] ) {
			$hidden[] = $key;
		}
		update_user_meta( get_current_user_id(), 'ai_act_labels_hidden', $hidden );
		return array( 'hidden' => $hidden );
	}

	/**
	 * The label as the site would show it, with settings not saved yet.
	 *
	 * @param WP_REST_Request $request `settings`, `id`.
	 * @return array
	 */
	public static function preview( WP_REST_Request $request ) {
		$settings = AI_Act_Labels::sanitize_settings( (array) ( $request['settings'] ?? array() ), AI_Act_Labels::settings() );
		$filter   = static fn() => $settings;
		add_filter( 'pre_option_' . AI_Act_Labels::OPTION, $filter );
		$id       = (int) ( $request['id'] ?? 0 );
		$out      = array( 'css' => AI_Act_Labels_Front::css() );
		foreach ( AI_Act_Labels::KINDS as $kind ) {
			$out[ $kind ] = AI_Act_Labels_Front::badge( $id, false, false, false, $kind );
		}
		$out['small'] = AI_Act_Labels_Front::badge( $id, false, false, true, 'generated' );
		remove_filter( 'pre_option_' . AI_Act_Labels::OPTION, $filter );
		return $out;
	}
}
