<?php
/**
 * The card from engenty: only text and links to engenty.ai or wordpress.org get through.
 *
 * @package AI_Act_Labels
 */

class PromoTest extends AI_Act_Labels_TestCase {

	private $body;

	protected function setUp(): void {
		parent::setUp();
		delete_transient( AI_Act_Labels_Promo::TRANSIENT );
		add_filter( 'pre_http_request', array( $this, 'answer' ), 10, 3 );
	}

	protected function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'answer' ), 10 );
		delete_transient( AI_Act_Labels_Promo::TRANSIENT );
		parent::tearDown();
	}

	public function answer( $pre, $args, $url ) {
		if ( AI_Act_Labels_Promo::URL !== $url ) {
			return $pre;
		}
		return null === $this->body ? new WP_Error( 'down', 'down' ) : array(
			'response' => array( 'code' => 200 ),
			'body'     => $this->body,
		);
	}

	public function test_the_card_comes_in_the_admins_language_as_text() {
		$this->body = wp_json_encode(
			array(
				'en' => array(
					'title'  => 'engenty <b>wizards</b>',
					'text'   => 'Guided flows.',
					'button' => array(
						'label' => 'engenty.ai',
						'url'   => 'https://engenty.ai/',
					),
				),
				'fr' => array(
					'title'  => 'Ailleurs',
					'button' => array(
						'label' => 'x',
						'url'   => 'https://example.com/',
					),
				),
			)
		);
		$card = AI_Act_Labels_Promo::card();
		$this->assertSame( 'engenty wizards', $card['title'] );
		$this->assertSame( 'https://engenty.ai/', $card['button']['url'] );
		$all = get_transient( AI_Act_Labels_Promo::TRANSIENT );
		$this->assertArrayNotHasKey( 'fr', $all, 'a link outside engenty.ai and wordpress.org drops the card' );
	}

	public function test_no_answer_no_card() {
		$this->body = null;
		$this->assertNull( AI_Act_Labels_Promo::card() );
	}
}
