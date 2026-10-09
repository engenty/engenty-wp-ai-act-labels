<?php
/**
 * Labels, notices, settings and the lists.
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

class LabelsTest extends AI_Act_Labels_TestCase {

	public function test_a_label_is_set_read_and_cleared() {
		$id = $this->image();
		$this->assertSame( '', AI_Act_Labels::get( $id ) );
		$this->assertTrue( AI_Act_Labels::set( $id, 'generated', 'manual', array( 'tool' => 'Midjourney' ) ) );
		$this->assertSame( 'generated', AI_Act_Labels::kind( $id ) );
		$this->assertSame( 'Dieses Bild wurde mit KI erzeugt. Werkzeug: Midjourney.', AI_Act_Labels::notice( $id ) );
		$this->assertSame( 'manual', get_post_meta( $id, AI_Act_Labels::META_DECIDED, true )['via'] );
		AI_Act_Labels::set( $id, 'none' );
		$this->assertSame( 'none', AI_Act_Labels::get( $id ) );
		$this->assertSame( '', AI_Act_Labels::kind( $id ) );
		AI_Act_Labels::set( $id, '' );
		$this->assertSame( '', AI_Act_Labels::get( $id ) );
	}

	public function test_unknown_states_and_non_attachments_are_refused() {
		$id = $this->image();
		$this->assertFalse( AI_Act_Labels::set( $id, 'deepfake' ) );
		$this->assertFalse( AI_Act_Labels::set( $this->post( 'x' ), 'generated' ) );
	}

	public function test_the_own_notice_wins_and_the_type_picks_the_default() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'modified', 'manual', array( 'notice' => 'Hintergrund mit KI ergänzt.' ) );
		$this->assertSame( 'Hintergrund mit KI ergänzt.', AI_Act_Labels::notice( $id ) );
		$this->assertSame( 'Dieses Video wurde mit KI verändert.', AI_Act_Labels::default_notice( 'modified', 'video' ) );
		AI_Act_Labels::save_settings( array( 'texts' => array( 'noticeModified' => 'Mit KI bearbeitet.' ) ) );
		$this->assertSame( 'Mit KI bearbeitet.', AI_Act_Labels::default_notice( 'modified', 'image' ) );
	}

	public function test_labels_of_the_theme_class_count_until_switched_off() {
		$id = $this->image();
		update_post_meta( $id, AI_Act_Labels::LEGACY, '1' );
		update_post_meta( $id, AI_Act_Labels::LEGACY_NOTICE, 'Mit KI.' );
		$this->assertSame( 'generated', AI_Act_Labels::get( $id ) );
		$this->assertSame( 'Mit KI.', AI_Act_Labels::notice( $id ) );
		$this->assertContains( $id, AI_Act_Labels::query_ids( 'labelled', -1 ) );
		AI_Act_Labels::save_settings( array( 'legacy' => false ) );
		$this->assertSame( '', AI_Act_Labels::get( $id ) );
		AI_Act_Labels::save_settings( array( 'legacy' => true ) );
		AI_Act_Labels::set( $id, '' );
		$this->assertSame( '', get_post_meta( $id, AI_Act_Labels::LEGACY, true ) );
	}

	public function test_settings_keep_only_what_is_allowed() {
		$s = AI_Act_Labels::save_settings( array( 'icon' => 'rainbow', 'color' => 'white-soft', 'size' => 'xxl', 'position' => 'top-left', 'where' => array( 'audio' => false ) ) );
		$this->assertSame( 'official', $s['icon'] );
		$this->assertSame( 'white-soft', $s['color'] );
		$this->assertSame( 'm', $s['size'] );
		$this->assertSame( 'top-left', $s['position'] );
		$this->assertFalse( $s['where']['audio'] );
		$this->assertTrue( $s['where']['video'] );
		$this->assertSame( 'official', AI_Act_Labels::save_settings( array( 'icon' => 'custom', 'custom' => 0 ) )['icon'] );
	}

	public function test_lists_find_suggestions_and_labelled_files() {
		$ai    = $this->attachment( 'team.jpg', AI_Act_Labels_Test_Files::jpeg_with_xmp( AI_Act_Labels_Test_Files::scene( 'team' ), 'trainedAlgorithmicMedia' ) );
		$plain = $this->image();
		$this->assertContains( $ai, AI_Act_Labels::query_ids( 'suggested', -1 ) );
		$this->assertNotContains( $plain, AI_Act_Labels::query_ids( 'suggested', -1 ) );
		AI_Act_Labels::set( $ai, 'generated' );
		$this->assertNotContains( $ai, AI_Act_Labels::query_ids( 'suggested', -1 ) );
		$this->assertContains( $ai, AI_Act_Labels::query_ids( 'generated', -1 ) );
		$this->assertContains( $plain, AI_Act_Labels::query_ids( 'undecided', -1 ) );
	}
}
