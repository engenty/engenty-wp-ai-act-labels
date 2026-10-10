<?php
/**
 * The assistant thinks through WordPress: `wp_ai_client_prompt()` with a JSON answer, on the AI
 * provider set up under Einstellungen › Konnektoren – no key of its own. It knows the AI Act from the
 * skill in skills/eu-ai-act-labels (the same files work in any agent that reads Agent Skills).
 * It looks at one media file (the picture itself, if the model can see, its traces and where it is
 * used) and says what label it needs – deciding stays with the person.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * Prompts and answers.
 */
class AI_Act_Labels_Assistant {

	const USAGE = 'ai_act_labels_ai_usage';

	/** Models tried in order; the AI Client falls back to the provider's first model. All of them see images. */
	const MODELS = array( 'wizards/standard', 'google/gemini-3.5-flash', 'gemini-3.5-flash', 'google/gemini-2.5-flash', 'gemini-2.5-flash', 'openai/gpt-5-mini', 'gpt-5-mini', 'anthropic/claude-haiku-4.5', 'claude-haiku-4-5', 'anthropic/claude-sonnet-5.5', 'claude-sonnet-5-5' );

	/**
	 * Whether WordPress has an AI Client and a provider; the providers it lists.
	 *
	 * @return array
	 */
	public static function status() {
		$has_wp = function_exists( 'wp_ai_client_prompt' );
		$ready  = false;
		$names  = array();
		if ( $has_wp && function_exists( 'wp_supports_ai' ) && wp_supports_ai() ) {
			try {
				$registry = \WordPress\AiClient\AiClient::defaultRegistry();
				foreach ( $registry->getRegisteredProviderIds() as $id ) {
					if ( $registry->isProviderConfigured( $id ) ) {
						$class   = $registry->getProviderClassName( $id );
						$names[] = $class::metadata()->getName();
					}
				}
				$ready = $names && (bool) wp_ai_client_prompt( 'ping' )->is_supported_for_text_generation();
			} catch ( \Throwable $e ) {
				$ready = false;
			}
		}
		$usage = get_option( self::USAGE, array() );
		return array(
			'wp'         => $has_wp,
			'ready'      => $ready,
			'providers'  => $names,
			'offers'     => self::offers(),
			'last'       => is_array( $usage ) ? ( $usage['last'] ?? '' ) : '',
			'tokens'     => is_array( $usage ) && ( $usage['month'] ?? '' ) === gmdate( 'Y-m' ) ? (int) ( $usage['tokens'] ?? 0 ) : 0,
			'connectors' => admin_url( 'options-connectors.php' ),
			'vercel'     => admin_url( 'plugin-install.php?s=' . rawurlencode( 'AI Provider for Vercel' ) . '&tab=search&type=term' ),
			'update'     => admin_url( 'update-core.php' ),
		);
	}

	/**
	 * The AI providers WordPress lists under Einstellungen › Konnektoren and how far each is set up:
	 * `ready`, `key` (plugin there, API Key missing), `offline` (needs no key, does not answer) or `plugin`.
	 *
	 * @return array[]
	 */
	private static function offers() {
		if ( ! function_exists( 'wp_get_connectors' ) ) {
			return array();
		}
		$offers = array();
		try {
			$registry = \WordPress\AiClient\AiClient::defaultRegistry();
			foreach ( wp_get_connectors() as $id => $connector ) {
				if ( 'ai_provider' !== ( $connector['type'] ?? '' ) ) {
					continue;
				}
				$active = is_callable( $connector['plugin']['is_active'] ?? null ) ? (bool) call_user_func( $connector['plugin']['is_active'] ) : true;
				$state  = 'plugin';
				if ( $active && $registry->hasProvider( $id ) ) {
					if ( $registry->isProviderConfigured( $id ) ) {
						$state = 'ready';
					} else {
						$state = 'none' === ( $connector['authentication']['method'] ?? '' ) ? 'offline' : 'key';
					}
				}
				$offers[] = array(
					'id'    => (string) $id,
					'name'  => (string) $connector['name'],
					'logo'  => (string) ( $connector['logo_url'] ?? '' ),
					'state' => $state,
				);
			}
		} catch ( \Throwable $e ) {
			return $offers;
		}
		return $offers;
	}

	/**
	 * The skill: SKILL.md without its front matter, and the reference files.
	 *
	 * @param string[] $references Reference files to add; empty: all.
	 * @return string
	 */
	public static function skill( array $references = array() ) {
		$dir  = AI_ACT_LABELS_DIR . 'skills/eu-ai-act-labels/';
		$main = (string) file_get_contents( $dir . 'SKILL.md' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		$main = (string) preg_replace( '/^---.*?---\s*/s', '', $main );
		$main = (string) preg_replace( '/\n## References.*$/s', '', $main );
		$refs = $references ? $references : array( 'article-50', 'deepfakes', 'icons-and-placement', 'metadata', 'text-and-chatbots' );
		foreach ( $refs as $ref ) {
			$file = $dir . 'references/' . $ref . '.md';
			if ( file_exists( $file ) ) {
				$main .= "\n\n" . file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			}
		}
		return $main;
	}

	/**
	 * Asks the provider for a JSON answer.
	 *
	 * @param string $system The system instruction.
	 * @param string $prompt The prompt.
	 * @param array  $schema The answer's JSON schema.
	 * @param string $file   A local image the model looks at (optional).
	 * @param string $mime   Its MIME type.
	 * @return array|WP_Error
	 */
	public static function generate( $system, $prompt, array $schema, $file = '', $mime = '' ) {
		if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
			return new WP_Error( 'ai_act_labels_no_ai', __( 'Image analysis (AI) needs WordPress 7.0 or newer.', 'ai-act-labels' ) );
		}
		try {
			$builder = wp_ai_client_prompt( $prompt );
			if ( $file ) {
				$builder = $builder->with_file( $file, $mime );
			}
			$result = $builder
				->using_system_instruction( $system )
				->using_model_preference( ...self::MODELS )
				->using_temperature( 0.2 )
				->using_max_tokens( 4000 )
				->as_json_response( $schema )
				->generate_text_result();
		} catch ( \Throwable $e ) {
			return new WP_Error( 'ai_act_labels_ai', $e->getMessage() );
		}
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		try {
			$text             = $result->toText();
			$usage            = get_option( self::USAGE, array() );
			$usage            = is_array( $usage ) && ( $usage['month'] ?? '' ) === gmdate( 'Y-m' ) ? $usage : array(
				'month'  => gmdate( 'Y-m' ),
				'tokens' => 0,
			);
			$usage['tokens'] += $result->getTokenUsage()->getTotalTokens();
			$usage['last']    = trim( $result->getProviderMetadata()->getName() . ', ' . $result->getModelMetadata()->getName(), ', ' );
			update_option( self::USAGE, $usage, false );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'ai_act_labels_ai', $e->getMessage() );
		}
		$data = self::decode( $text );
		return null === $data ? new WP_Error( 'ai_act_labels_ai_json', __( 'The answer was not JSON. Try again.', 'ai-act-labels' ) ) : $data;
	}

	/**
	 * JSON from a model's text, also inside a code fence.
	 *
	 * @param string $text Text.
	 * @return array|null
	 */
	public static function decode( $text ) {
		$text = trim( (string) $text );
		if ( preg_match( '/```(?:json)?\s*(.*?)```/s', $text, $m ) ) {
			$text = trim( $m[1] );
		}
		$data = json_decode( $text, true );
		if ( ! is_array( $data ) && preg_match( '/\{.*\}/s', $text, $m ) ) {
			$data = json_decode( $m[0], true );
		}
		return is_array( $data ) ? $data : null;
	}

	/**
	 * The admin's language for answers; the site's for notices.
	 *
	 * @return array `admin`, `site`.
	 */
	private static function languages() {
		$name = static fn( $locale ) => str_starts_with( $locale, 'de' ) ? 'German' : ( str_starts_with( $locale, 'en' ) ? 'English' : $locale );
		return array(
			'admin' => str_starts_with( get_user_locale(), 'de' ) ? 'German (informal "du")' : $name( get_user_locale() ),
			'site'  => $name( get_locale() ),
		);
	}

	/**
	 * One media file as the model needs it.
	 *
	 * @param int $id Attachment ID.
	 * @return array
	 */
	private static function media_context( $id ) {
		$d       = AI_Act_Labels::describe( $id, false );
		$signals = is_array( $d['signals'] ) ? $d['signals'] : array();
		$uses    = array();
		foreach ( AI_Act_Labels_Usage::for_attachment( $id ) as $use ) {
			$uses[] = $use['title'] . ' (' . $use['type'] . ', ' . $use['context'] . ')';
		}
		$post = get_post( $id );
		return array(
			'id'          => $id,
			'title'       => $d['title'],
			'file'        => $d['file'],
			'type'        => $d['mime'],
			'uploaded'    => $d['date'] ? gmdate( 'Y-m-d', (int) $d['date'] ) : '',
			'alt'         => $d['alt'],
			'caption'     => $d['caption'],
			'description' => $post ? wp_trim_words( wp_strip_all_tags( $post->post_content ), 40 ) : '',
			'decision'    => $d['state'] ? $d['state'] : 'none yet',
			'traces'      => array_map(
				static fn( $i ) => trim( ( $i['label'] ?? '' ) . ( ! empty( $i['strength'] ) ? ' [' . $i['strength'] . ']' : '' ) ),
				(array) ( $signals['items'] ?? array() )
			),
			'usedOn'      => array_slice( $uses, 0, 6 ),
		);
	}

	/**
	 * The schema of an assessment.
	 *
	 * @return array
	 */
	private static function review_schema() {
		$str = array( 'type' => 'string' );
		return array(
			'type'       => 'object',
			'properties' => array(
				'kind'       => array(
					'type' => 'string',
					'enum' => array( 'generated', 'modified', 'none', 'unsure' ),
				),
				'deepfake'   => array(
					'type' => 'string',
					'enum' => array( 'yes', 'no', 'unsure' ),
				),
				'duty'       => array(
					'type' => 'string',
					'enum' => array( 'required', 'voluntary', 'none', 'unsure' ),
				),
				'confidence' => array(
					'type' => 'string',
					'enum' => array( 'low', 'medium', 'high' ),
				),
				'reason'     => $str,
				'question'   => $str,
				'notice'     => $str,
				'tool'       => $str,
			),
			'required'   => array( 'kind', 'deepfake', 'duty', 'confidence', 'reason' ),
		);
	}

	/**
	 * Looks at one media file and keeps the assessment.
	 *
	 * @param int $id Attachment ID.
	 * @return array|WP_Error The assessment.
	 */
	public static function review( $id ) {
		$id = (int) $id;
		if ( 'attachment' !== get_post_type( $id ) ) {
			return new WP_Error( 'ai_act_labels_missing', __( 'This file does not exist.', 'ai-act-labels' ) );
		}
		$langs  = self::languages();
		$system = implode(
			"\n",
			array(
				'You help the owner of a website in the EU decide whether one media file needs an AI label under the EU AI Act. Your knowledge:',
				self::skill( array( 'deepfakes', 'metadata' ) ),
				'',
				'How to judge: traces in the file are the strongest evidence. What the picture looks like is only a weak hint – never claim a photo is AI-made just because it looks polished, and never claim it is not AI-made because it looks real. If you cannot tell whether AI was involved, answer kind "unsure" and ask the owner one short question. When AI was involved, decide whether the file is a deepfake (looks real and shows existing or plausibly existing people, things, places or events) – then duty "required"; stylised or obviously artificial images are duty "voluntary"; standard editing is kind "none".',
				'Answer with JSON only: kind, deepfake, duty, confidence, reason (one or two short sentences in ' . $langs['admin'] . ', address the owner directly), question (only when unsure, in ' . $langs['admin'] . '), notice (a notice for visitors in ' . $langs['site'] . ', one short sentence, only when a label fits), tool (the AI tool if the traces name one).',
			)
		);
		$prompt = 'Site: ' . get_bloginfo( 'name' ) . ' – ' . get_bloginfo( 'description' ) . "\nMedia file (JSON): " . wp_json_encode( self::media_context( $id ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
		$file   = '';
		$mime   = '';
		if ( 'image' === AI_Act_Labels::media_type( $id ) ) {
			$size = image_get_intermediate_size( $id, 'medium_large' );
			$size = $size ? $size : image_get_intermediate_size( $id, 'medium' );
			$path = $size && ! empty( $size['path'] ) ? path_join( wp_get_upload_dir()['basedir'], $size['path'] ) : get_attached_file( $id );
			if ( $path && file_exists( $path ) && filesize( $path ) < 4 * MB_IN_BYTES && in_array( wp_check_filetype( $path )['type'], array( 'image/jpeg', 'image/png', 'image/webp', 'image/gif' ), true ) ) {
				$file    = $path;
				$mime    = (string) wp_check_filetype( $path )['type'];
				$prompt .= "\nThe picture is attached.";
			}
		}
		$answer = self::generate( $system, $prompt, self::review_schema(), $file, $mime );
		$seen   = (bool) $file;
		if ( is_wp_error( $answer ) && $file ) {
			// The model cannot see pictures: the traces and the context alone.
			$answer = self::generate( $system, str_replace( "\nThe picture is attached.", "\nThe picture could not be shown to you.", $prompt ), self::review_schema() );
			$seen   = false;
		}
		if ( is_wp_error( $answer ) ) {
			return $answer;
		}
		$usage = get_option( self::USAGE, array() );
		$hint  = array(
			'kind'       => AI_Act_Labels::one_of( $answer['kind'] ?? '', array( 'generated', 'modified', 'none', 'unsure' ), 'unsure' ),
			'deepfake'   => AI_Act_Labels::one_of( $answer['deepfake'] ?? '', array( 'yes', 'no', 'unsure' ), 'unsure' ),
			'duty'       => AI_Act_Labels::one_of( $answer['duty'] ?? '', array( 'required', 'voluntary', 'none', 'unsure' ), 'unsure' ),
			'confidence' => AI_Act_Labels::one_of( $answer['confidence'] ?? '', array( 'low', 'medium', 'high' ), 'low' ),
			'reason'     => sanitize_text_field( (string) ( $answer['reason'] ?? '' ) ),
			'question'   => sanitize_text_field( (string) ( $answer['question'] ?? '' ) ),
			'notice'     => sanitize_text_field( (string) ( $answer['notice'] ?? '' ) ),
			'tool'       => sanitize_text_field( (string) ( $answer['tool'] ?? '' ) ),
			'seen'       => $seen,
			'model'      => is_array( $usage ) ? (string) ( $usage['last'] ?? '' ) : '',
			'at'         => time(),
		);
		update_post_meta( $id, AI_Act_Labels::META_HINT, $hint );
		AI_Act_Labels::refresh_open( $id );
		return $hint;
	}
}
