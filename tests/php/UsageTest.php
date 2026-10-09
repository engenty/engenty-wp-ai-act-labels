<?php
/**
 * Where media is used.
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

class UsageTest extends AI_Act_Labels_TestCase {

	public function test_a_post_names_its_media_and_how() {
		$block = $this->image();
		$thumb = $this->image();
		$raw   = $this->image( 'only-a-url.jpg' );
		$post  = get_post( $this->post( $this->image_block( $block ) . '<!-- wp:html --><img src="' . wp_get_attachment_image_url( $raw, 'medium' ) . '"><!-- /wp:html -->' ) );
		set_post_thumbnail( $post, $thumb );
		$found = AI_Act_Labels_Usage::in_post( $post );
		$this->assertSame( array( 'image' ), $found[ $block ] );
		$this->assertSame( array( 'featured' ), $found[ $thumb ] );
		$this->assertSame( array( 'url' ), $found[ $raw ] );
	}

	public function test_galleries_and_classic_galleries() {
		$a    = $this->image();
		$b    = $this->image();
		$post = get_post( $this->post( '<!-- wp:gallery --><figure class="wp-block-gallery">' . $this->image_block( $a ) . '</figure><!-- /wp:gallery -->[gallery ids="' . $b . '"]' ) );
		$found = AI_Act_Labels_Usage::in_post( $post );
		$this->assertSame( array( 'gallery' ), $found[ $a ] );
		$this->assertSame( array( 'gallery' ), $found[ $b ] );
	}

	public function test_the_check_writes_usage_and_reads_traces() {
		$ai = $this->attachment( 'used.jpg', AI_Act_Labels_Test_Files::jpeg_with_xmp( AI_Act_Labels_Test_Files::scene( 'team' ), 'trainedAlgorithmicMedia' ) );
		delete_post_meta( $ai, AI_Act_Labels::META_SIGNALS );
		$this->post( $this->image_block( $ai ) );
		$p = AI_Act_Labels_Usage::step( true );
		while ( 'done' !== $p['phase'] ) {
			$p = AI_Act_Labels_Usage::step();
		}
		$this->assertSame( 'image', AI_Act_Labels_Usage::for_attachment( $ai )[0]['context'] );
		$this->assertTrue( AI_Act_Labels_Usage::for_attachment( $ai )[0]['auto'] );
		$this->assertSame( 'generated', get_post_meta( $ai, AI_Act_Labels::META_SIGNALS, true )['kind'] );
		$this->assertContains( $ai, AI_Act_Labels::query_ids( 'unchecked', -1 ) );
		$this->assertContains( $ai, AI_Act_Labels::query_ids( 'suggested', -1 ) );
	}

	public function test_a_url_of_a_size_finds_its_attachment() {
		$id = $this->image( 'sized.jpg', 1600, 1200 );
		$this->assertSame( $id, AI_Act_Labels_Usage::id_from_url( wp_get_attachment_image_url( $id, 'medium' ) ) );
	}
}
