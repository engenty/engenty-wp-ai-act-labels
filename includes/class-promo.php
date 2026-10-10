<?php
/**
 * The card from engenty at the end of the tool: its words come from engenty.ai, not from the plugin, so
 * they can name what is live without a release. The request carries nothing about the site – the same
 * file for everyone, once a day; the plugin picks the admin's language and prints the words as text.
 *
 * @package AI_Act_Labels
 */

defined( 'ABSPATH' ) || exit;

/**
 * Fetches and keeps the card.
 */
class AI_Act_Labels_Promo {

	const URL       = 'https://engenty.ai/wordpress-plugins/ai-act-image-labels/promo.json';
	const TRANSIENT = 'ai_act_labels_promo';

	/**
	 * The card in the admin's language, or null when engenty.ai has none or did not answer.
	 *
	 * @return array|null `kicker`, `title`, `text`, `engenty`, `button` (`label`, `url`).
	 */
	public static function card() {
		$all = get_transient( self::TRANSIENT );
		if ( false === $all ) {
			$all = self::fetch();
			// A day when engenty.ai answered, an hour when it did not.
			set_transient( self::TRANSIENT, $all, $all ? DAY_IN_SECONDS : HOUR_IN_SECONDS );
		}
		$lang = substr( get_user_locale(), 0, 2 );
		$card = $all[ $lang ] ?? $all['en'] ?? null;
		return is_array( $card ) ? $card : null;
	}

	/**
	 * The file from engenty.ai, every field checked: plain text, links only to engenty.ai and wordpress.org.
	 *
	 * @return array Cards by language; empty when there is nothing usable.
	 */
	private static function fetch() {
		$response = wp_safe_remote_get( self::URL, array( 'timeout' => 3 ) );
		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}
		$data = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		$out  = array();
		foreach ( is_array( $data ) ? $data : array() as $lang => $card ) {
			$url = esc_url_raw( (string) ( $card['button']['url'] ?? '' ), array( 'https' ) );
			if ( ! preg_match( '/^[a-z]{2}$/', (string) $lang ) || ! is_array( $card ) || empty( $card['title'] ) || ! self::allowed( $url ) ) {
				continue;
			}
			$out[ $lang ] = array(
				'kicker'  => sanitize_text_field( (string) ( $card['kicker'] ?? '' ) ),
				'title'   => sanitize_text_field( (string) $card['title'] ),
				'text'    => sanitize_text_field( (string) ( $card['text'] ?? '' ) ),
				'engenty' => sanitize_key( (string) ( $card['engenty'] ?? 'round' ) ),
				'button'  => array(
					'label' => sanitize_text_field( (string) ( $card['button']['label'] ?? '' ) ),
					'url'   => $url,
				),
			);
		}
		return $out;
	}

	/**
	 * Whether a link may appear on the card.
	 *
	 * @param string $url Address.
	 * @return bool
	 */
	private static function allowed( $url ) {
		$host = (string) wp_parse_url( $url, PHP_URL_HOST );
		return in_array( $host, array( 'engenty.ai', 'wordpress.org' ), true );
	}
}
