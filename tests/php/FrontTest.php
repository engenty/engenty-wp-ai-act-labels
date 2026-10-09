<?php
/**
 * The label on the site.
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

class FrontTest extends AI_Act_Labels_TestCase {

	public function test_featured_images_get_the_icon_and_keep_their_alt() {
		$id = $this->image();
		update_post_meta( $id, '_wp_attachment_image_alt', 'Eine Hobelbank' );
		$this->assertStringNotContainsString( 'ai-act-label', wp_get_attachment_image( $id, 'large' ) );
		AI_Act_Labels::set( $id, 'generated' );
		$html = wp_get_attachment_image( $id, 'large' );
		$this->assertStringContainsString( 'data-ai-act-id="' . $id . '"', $html );
		$this->assertStringContainsString( 'ai-act-icon--generated', $html );
		$this->assertStringContainsString( 'alt="Eine Hobelbank"', $html );
		$this->assertStringContainsString( 'aria-label="KI-generiert: Dieses Bild wurde mit KI erzeugt."', $html );
	}

	public function test_none_and_undecided_files_stay_as_they_are() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'none' );
		$this->assertStringNotContainsString( 'ai-act-label', wp_get_attachment_image( $id, 'large' ) );
	}

	public function test_an_image_block_gets_the_icon_once_and_the_notice_behind_its_caption() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'modified' );
		$html = $this->render( $this->image_block( $id, 'Unsere Küche' ) );
		$this->assertSame( 1, substr_count( $html, 'data-ai-act-id="' . $id . '"' ) );
		$this->assertStringContainsString( 'Unsere Küche<span class="ai-act-label__caption"> – Dieses Bild wurde mit KI verändert.</span></figcaption>', $html );
		// The caption carries the notice: the icon is not read a second time.
		$this->assertStringContainsString( 'ai-act-label__badge is-official is-black is-bottom-right" style="--ai-act-h:30px;--ai-act-r:4.619" aria-hidden="true"', $html );
		$this->assertStringContainsString( 'alt="Alt bleibt"', $html );
	}

	public function test_no_new_caption_appears() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'generated' );
		$this->assertStringNotContainsString( 'figcaption', $this->render( $this->image_block( $id ) ) );
	}

	public function test_an_image_in_an_html_block_is_found_by_its_file() {
		$id  = $this->image( 'raw-image.jpg' );
		$url = wp_get_attachment_image_url( $id, 'medium' );
		AI_Act_Labels::set( $id, 'generated' );
		$html = $this->render( '<!-- wp:html --><p><img src="' . $url . '" alt="x" width="300"></p><!-- /wp:html -->' );
		$this->assertStringContainsString( 'data-ai-act-id="' . $id . '"', $html );
	}

	public function test_small_images_get_the_round_icon() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'generated' );
		$this->assertStringContainsString( 'ai-act-icon--basic', wp_get_attachment_image( $id, 'thumbnail' ) );
	}

	public function test_a_cover_gets_the_icon_inside_not_around_its_background() {
		$id  = $this->image();
		$url = wp_get_attachment_image_url( $id, 'full' );
		AI_Act_Labels::set( $id, 'generated' );
		$html = $this->render( '<!-- wp:cover {"url":"' . $url . '","id":' . $id . ',"dimRatio":50} --><div class="wp-block-cover"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><img class="wp-block-cover__image-background wp-image-' . $id . '" alt="" src="' . $url . '" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph --><p>Hallo</p><!-- /wp:paragraph --></div></div><!-- /wp:cover -->' );
		$this->assertMatchesRegularExpression( '/<div data-ai-act-id="' . $id . '" class="ai-act-host wp-block-cover[^"]*"[^>]*><span class="ai-act-label__badge/', $html );
		$this->assertStringNotContainsString( '<span class="ai-act-label ', $html );
	}

	public function test_the_settings_change_the_icon() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'generated' );
		AI_Act_Labels::save_settings( array( 'icon' => 'basic-text', 'color' => 'white', 'position' => 'top-left', 'size' => 'l' ) );
		$html = wp_get_attachment_image( $id, 'large' );
		$this->assertStringContainsString( 'is-basic-text is-white is-top-left', $html );
		$this->assertStringContainsString( '<span class="ai-act-label__text">KI-generiert</span>', $html );
		$this->assertStringContainsString( '--ai-act-h:38px', $html );
		AI_Act_Labels::save_settings( array( 'where' => array( 'featured' => false ) ) );
		$this->assertStringNotContainsString( 'ai-act-label', wp_get_attachment_image( $id, 'large' ) );
	}

	public function test_the_theme_helpers() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'generated' );
		$this->assertSame( 'generated', ai_act_labels_kind( $id ) );
		$this->assertSame( 'Foto: Anna – Dieses Bild wurde mit KI erzeugt.', ai_act_labels_append_notice( 'Foto: Anna', $id ) );
		$this->assertSame( '', ai_act_labels_append_notice( '', $id ) );
		$this->assertStringContainsString( 'aria-hidden="true"', ai_act_labels_wrap( '<img src="x.jpg" alt="">', $id, true ) );
	}

	public function test_the_dark_corner_gets_the_white_icon() {
		$im = imagecreatetruecolor( 400, 300 );
		imagefill( $im, 0, 0, imagecolorallocate( $im, 20, 20, 30 ) );
		$id = $this->attachment( 'dark.jpg', AI_Act_Labels_Test_Files::jpeg( $im ) );
		$this->assertSame( 'white', AI_Act_Labels_Front::tone( $id, 'bottom-right' ) );
		$this->assertSame( 'black', AI_Act_Labels_Front::tone( $this->image(), 'bottom-right' ) );
	}
}
