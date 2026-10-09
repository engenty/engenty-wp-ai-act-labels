<?php
/**
 * Keeps the site as it was: settings are put back, the attachments and posts a test made are deleted.
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

use PHPUnit\Framework\TestCase as Base;

/**
 * A test with media of its own.
 */
abstract class AI_Act_Labels_TestCase extends Base {

	/** @var array Options before the test. */
	private $kept = array();

	/** @var int[] Posts and attachments made by the test. */
	protected $made = array();

	protected function setUp(): void {
		foreach ( array( AI_Act_Labels::OPTION, AI_Act_Labels_Front::INDEX, AI_Act_Labels_Usage::RUN, AI_Act_Labels_Usage::LAST ) as $option ) {
			$this->kept[ $option ] = get_option( $option, null );
		}
		delete_option( AI_Act_Labels::OPTION );
		AI_Act_Labels_Front::forget();
		wp_set_current_user( 1 );
	}

	protected function tearDown(): void {
		foreach ( $this->made as $id ) {
			wp_delete_post( $id, true );
		}
		foreach ( $this->kept as $option => $value ) {
			if ( null === $value ) {
				delete_option( $option );
			} else {
				update_option( $option, $value );
			}
		}
		AI_Act_Labels_Front::forget();
	}

	/**
	 * An attachment from bytes.
	 */
	protected function attachment( $name, $bytes, $title = '' ) {
		$upload = wp_upload_bits( wp_unique_filename( wp_get_upload_dir()['path'], $name ), null, $bytes );
		$type   = wp_check_filetype( $upload['file'] );
		$id     = wp_insert_attachment(
			array(
				'post_title'     => $title ? $title : pathinfo( $name, PATHINFO_FILENAME ),
				'post_mime_type' => $type['type'],
				'post_status'    => 'inherit',
			),
			$upload['file']
		);
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
		$this->made[] = $id;
		return $id;
	}

	/**
	 * A plain JPEG attachment.
	 */
	protected function image( $name = 'plain.jpg', $w = 800, $h = 600 ) {
		return $this->attachment( $name, AI_Act_Labels_Test_Files::jpeg( AI_Act_Labels_Test_Files::scene( 'bench', $w, $h ) ) );
	}

	/**
	 * A published post.
	 */
	protected function post( $content, $type = 'page' ) {
		$id           = wp_insert_post(
			array(
				'post_type'    => $type,
				'post_status'  => 'publish',
				'post_title'   => 'Test ' . wp_generate_password( 6, false ),
				'post_content' => $content,
			)
		);
		$this->made[] = $id;
		return $id;
	}

	/**
	 * Markup of an image block.
	 */
	protected function image_block( $id, $caption = '' ) {
		$fig = $caption ? '<figcaption class="wp-element-caption">' . $caption . '</figcaption>' : '';
		return '<!-- wp:image {"id":' . $id . ',"sizeSlug":"large"} --><figure class="wp-block-image size-large"><img src="' . wp_get_attachment_image_url( $id, 'large' ) . '" alt="Alt bleibt" class="wp-image-' . $id . '"/>' . $fig . '</figure><!-- /wp:image -->';
	}

	/**
	 * The content as the site renders it.
	 */
	protected function render( $content ) {
		return apply_filters( 'the_content', $content );
	}
}
