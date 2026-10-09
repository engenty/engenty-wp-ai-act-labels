<?php
/**
 * The media library and the REST routes.
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

class MediaTest extends AI_Act_Labels_TestCase {

	public function test_the_fields_save_through_wordpress() {
		$id = $this->image();
		AI_Act_Labels_Media::save( array( 'ID' => $id ), array( 'ai_act_label' => 'modified', 'ai_act_tool' => 'Firefly' ) );
		$this->assertSame( 'modified', AI_Act_Labels::get( $id ) );
		$this->assertSame( 'Firefly', get_post_meta( $id, AI_Act_Labels::META_TOOL, true ) );
		$fields = AI_Act_Labels_Media::fields( array(), get_post( $id ) );
		$this->assertArrayHasKey( 'ai_act_label', $fields );
		$this->assertStringContainsString( 'value="modified" selected', $fields['ai_act_label']['html'] );
		$this->assertArrayHasKey( 'ai_act_notice', $fields );
	}

	public function test_bulk_actions_label_and_clear() {
		$a   = $this->image();
		$b   = $this->image();
		$url = AI_Act_Labels_Media::bulk( 'upload.php', 'ai_act_generated', array( $a, $b ) );
		$this->assertStringContainsString( 'ai_act_done=2', $url );
		$this->assertSame( 'generated', AI_Act_Labels::get( $b ) );
		AI_Act_Labels_Media::bulk( 'upload.php', 'ai_act_clear', array( $a ) );
		$this->assertSame( '', AI_Act_Labels::get( $a ) );
		$this->assertSame( 'upload.php', AI_Act_Labels_Media::bulk( 'upload.php', 'delete', array( $a ) ) );
	}

	public function test_the_grid_gets_the_label_and_filters_by_it() {
		$id = $this->image();
		AI_Act_Labels::set( $id, 'generated' );
		$this->assertSame( 'generated', wp_prepare_attachment_for_js( $id )['aiAct']['state'] );
		$_REQUEST['query'] = array( 'ai_act' => 'generated' );
		$args              = AI_Act_Labels_Media::grid_query( array( 'post_type' => 'attachment' ) );
		unset( $_REQUEST['query'] );
		$this->assertNotEmpty( $args['meta_query'] );
		$this->assertContains( $id, array_map( 'intval', get_posts( array_merge( $args, array( 'post_status' => 'inherit', 'fields' => 'ids', 'posts_per_page' => -1 ) ) ) ) );
	}

	public function test_rest_routes_label_and_need_permission() {
		$routes = rest_get_server()->get_routes( 'ai-act-labels/v1' );
		foreach ( array( 'state', 'media', 'label', 'settings', 'scan', 'review', 'verify', 'assist', 'preview' ) as $route ) {
			$this->assertArrayHasKey( '/ai-act-labels/v1/' . $route, $routes );
		}
		$id      = $this->image();
		$request = new WP_REST_Request( 'POST', '/ai-act-labels/v1/label' );
		$request->set_param( 'ids', array( $id ) );
		$request->set_param( 'state', 'generated' );
		$this->assertSame( 200, rest_do_request( $request )->get_status() );
		$this->assertSame( 'generated', AI_Act_Labels::get( $id ) );
		wp_set_current_user( 0 );
		$this->assertSame( 401, rest_do_request( $request )->get_status() );
	}

	public function test_the_preview_renders_with_unsaved_settings() {
		$request = new WP_REST_Request( 'POST', '/ai-act-labels/v1/preview' );
		$request->set_param( 'settings', array( 'icon' => 'basic' ) );
		$data = rest_do_request( $request )->get_data();
		$this->assertStringContainsString( 'ai-act-icon--basic', $data['generated'] );
		$this->assertSame( 'official', AI_Act_Labels::settings()['icon'] );
	}

	public function test_the_skill_is_loaded_for_the_assistant() {
		$skill = AI_Act_Labels_Assistant::skill();
		$this->assertStringContainsString( 'Deciding one media file', $skill );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', $skill );
		$this->assertStringNotContainsString( 'name: eu-ai-act-labels', $skill );
	}
}
