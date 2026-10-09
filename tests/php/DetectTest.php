<?php
/**
 * Traces of AI in files.
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

class DetectTest extends AI_Act_Labels_TestCase {

	private function file( $bytes, $name ) {
		$path = get_temp_dir() . 'ai-act-test-' . wp_generate_password( 6, false ) . '-' . $name;
		file_put_contents( $path, $bytes );
		return $path;
	}

	public function test_iptc_trained_algorithmic_media_is_generated_and_strong() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::jpeg_with_xmp( AI_Act_Labels_Test_Files::scene( 'team' ), 'trainedAlgorithmicMedia' ), 'a.jpg' ), 'image/jpeg' );
		$this->assertSame( 'generated', $r['kind'] );
		$this->assertSame( 'strong', $r['strength'] );
	}

	public function test_iptc_composite_with_ai_is_modified() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::jpeg_with_xmp( AI_Act_Labels_Test_Files::scene( 'kitchen' ), 'compositeWithTrainedAlgorithmicMedia' ), 'b.jpg' ), 'image/jpeg' );
		$this->assertSame( 'modified', $r['kind'] );
	}

	public function test_a_camera_capture_says_no_ai() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::jpeg_with_xmp( AI_Act_Labels_Test_Files::scene( 'bench' ), 'digitalCapture' ), 'c.jpg' ), 'image/jpeg' );
		$this->assertSame( '', $r['kind'] );
		$this->assertTrue( $r['human'] );
	}

	public function test_c2pa_with_generative_fill_is_modified_with_its_tool() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::jpeg_with_c2pa( AI_Act_Labels_Test_Files::scene( 'kitchen' ), 'compositeWithTrainedAlgorithmicMedia', 'Adobe Photoshop 27.0 (Generative Fill)' ), 'd.jpg' ), 'image/jpeg' );
		$this->assertSame( 'modified', $r['kind'] );
		$this->assertSame( 'strong', $r['strength'] );
		$this->assertSame( 'Adobe Photoshop', $r['tool'] );
		$this->assertSame( 'c2pa', $r['items'][0]['source'] );
	}

	public function test_stable_diffusion_parameters_in_a_png() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::png_with_text( AI_Act_Labels_Test_Files::scene( 'dusk', 300, 200 ), 'parameters', "a house\nSteps: 20, Sampler: Euler a, CFG scale: 7" ), 'e.png' ), 'image/png' );
		$this->assertSame( 'generated', $r['kind'] );
		$this->assertSame( 'Stable Diffusion', $r['tool'] );
	}

	public function test_comfyui_workflow_in_a_png() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::png_with_text( AI_Act_Labels_Test_Files::scene( 'dusk', 300, 200 ), 'prompt', '{"3":{"class_type":"KSampler"}}' ), 'f.png' ), 'image/png' );
		$this->assertSame( 'ComfyUI', $r['tool'] );
	}

	public function test_a_gemini_file_name_is_a_weak_hint() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::png( AI_Act_Labels_Test_Files::scene( 'forest', 300, 200 ) ), 'Gemini_Generated_Image_abc123.png' ), 'image/png' );
		$this->assertSame( 'generated', $r['kind'] );
		$this->assertSame( 'weak', $r['strength'] );
		$this->assertSame( 'Google Gemini', $r['tool'] );
	}

	public function test_a_plain_photo_has_no_traces() {
		$r = AI_Act_Labels_Detect::file( $this->file( AI_Act_Labels_Test_Files::jpeg( AI_Act_Labels_Test_Files::scene( 'bench' ) ), 'werkstatt.jpg' ), 'image/jpeg' );
		$this->assertSame( '', $r['kind'] );
		$this->assertSame( array(), $r['items'] );
	}

	public function test_uploads_are_read_and_unambiguous_ones_labelled_when_wanted() {
		$id = $this->attachment( 'g.jpg', AI_Act_Labels_Test_Files::jpeg_with_xmp( AI_Act_Labels_Test_Files::scene( 'team' ), 'trainedAlgorithmicMedia' ) );
		$this->assertSame( 'generated', get_post_meta( $id, AI_Act_Labels::META_SIGNALS, true )['kind'] );
		$this->assertSame( '', AI_Act_Labels::get( $id ) );
		AI_Act_Labels::save_settings( array( 'auto' => true ) );
		$id = $this->attachment( 'h.jpg', AI_Act_Labels_Test_Files::jpeg_with_xmp( AI_Act_Labels_Test_Files::scene( 'team' ), 'trainedAlgorithmicMedia' ) );
		$this->assertSame( 'generated', AI_Act_Labels::get( $id ) );
		$this->assertSame( 'metadata', get_post_meta( $id, AI_Act_Labels::META_DECIDED, true )['via'] );
	}
}
