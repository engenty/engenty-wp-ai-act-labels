<?php
/**
 * Demo content for a test site: media with and without traces of AI, used in the ways sites use them.
 *   wp eval-file tests/fixtures/demo-content.php
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

require_once ABSPATH . 'wp-admin/includes/image.php';
require_once __DIR__ . '/files.php';

$dir = get_temp_dir() . 'ai-act-demo/';
wp_mkdir_p( $dir );

$make = static function ( $name, $bytes, $title, $alt = '', $caption = '' ) use ( $dir ) {
	$path = $dir . $name;
	file_put_contents( $path, $bytes );
	$upload = wp_upload_bits( $name, null, $bytes );
	$type   = wp_check_filetype( $upload['file'] );
	$id     = wp_insert_attachment(
		array(
			'post_title'     => $title,
			'post_excerpt'   => $caption,
			'post_mime_type' => $type['type'],
			'post_status'    => 'inherit',
		),
		$upload['file']
	);
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
	if ( $alt ) {
		update_post_meta( $id, '_wp_attachment_image_alt', $alt );
	}
	return $id;
};

$f = 'AI_Act_Labels_Test_Files';
$ids = array(
	'header'   => $make( 'werkstatt-header.png', $f::png_with_text( $f::scene( 'dusk', 1600, 900 ), 'parameters', "a cozy carpentry workshop at dusk, warm light\nSteps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1234, Model: sdxl_base" ), 'Werkstatt am Abend', 'Werkstatt mit warmem Licht am Abend' ),
	'team'     => $make( 'team-in-der-werkstatt.jpg', $f::jpeg_with_xmp( $f::scene( 'team', 1400, 933 ), 'trainedAlgorithmicMedia' ), 'Unser Team', 'Drei Personen an der Hobelbank', 'Unser Team in der Werkstatt' ),
	'kitchen'  => $make( 'kueche-eiche.jpg', $f::jpeg_with_c2pa( $f::scene( 'kitchen', 1400, 933 ), 'compositeWithTrainedAlgorithmicMedia', 'Adobe Photoshop 27.0 (Generative Fill)' ), 'Küche aus Eiche', 'Küche aus Eiche mit Kochinsel' ),
	'gemini'   => $make( 'Gemini_Generated_Image_k2x9b1.png', $f::png( $f::scene( 'forest', 1200, 800 ) ), 'Holz aus dem Wald', 'Baumstämme im Wald' ),
	'camera'   => $make( 'hobelbank.jpg', $f::jpeg_with_xmp( $f::scene( 'bench', 1200, 800 ), 'digitalCapture' ), 'Hobelbank', 'Eine alte Hobelbank' ),
	'chair'    => $make( 'stuhl-entwurf.png', $f::png( $f::scene( 'chair', 1000, 1000 ) ), 'Stuhl-Entwurf', 'Skizze eines Stuhls' ),
	'sawdust'  => $make( 'spaene.jpg', $f::jpeg( $f::scene( 'sawdust', 1200, 800 ) ), 'Späne', 'Holzspäne auf dem Boden' ),
	'logo'     => $make( 'logo-tischlerei.png', $f::png( $f::scene( 'logo', 400, 400 ) ), 'Logo', 'Tischlerei Huber' ),
);

$upload = wp_get_upload_dir();
$url    = static fn( $id, $size = 'large' ) => wp_get_attachment_image_url( $id, $size );

$image_block = static function ( $id, $caption = '' ) use ( $url ) {
	$fig = $caption ? '<figcaption class="wp-element-caption">' . $caption . '</figcaption>' : '';
	return '<!-- wp:image {"id":' . $id . ',"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large"><img src="' . $url( $id ) . '" alt="' . esc_attr( get_post_meta( $id, '_wp_attachment_image_alt', true ) ) . '" class="wp-image-' . $id . '"/>' . $fig . '</figure><!-- /wp:image -->';
};

$front = '<!-- wp:cover {"url":"' . $url( $ids['header'], 'full' ) . '","id":' . $ids['header'] . ',"dimRatio":30,"minHeight":520,"isDark":true,"align":"full"} --><div class="wp-block-cover alignfull is-dark" style="min-height:520px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-30 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-' . $ids['header'] . '" alt="" src="' . $url( $ids['header'], 'full' ) . '" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","level":1} --><h1 class="wp-block-heading has-text-align-center">Tischlerei Huber</h1><!-- /wp:heading --><!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Möbel, die bleiben. Seit 1962 in Graz.</p><!-- /wp:paragraph --></div></div><!-- /wp:cover -->'
	. '<!-- wp:paragraph --><p>Wir planen und bauen Küchen, Tische und Stühle aus heimischem Holz.</p><!-- /wp:paragraph -->'
	. $image_block( $ids['team'], 'Unser Team in der Werkstatt' )
	. '<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped">' . $image_block( $ids['kitchen'] ) . $image_block( $ids['camera'] ) . $image_block( $ids['chair'] ) . '</figure><!-- /wp:gallery -->';

$front_id = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Start', 'post_content' => $front ) );

$about = '<!-- wp:media-text {"mediaId":' . $ids['camera'] . ',"mediaType":"image"} --><div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="' . $url( $ids['camera'] ) . '" alt="Eine alte Hobelbank" class="wp-image-' . $ids['camera'] . ' size-full"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph --><p>Die Hobelbank ist älter als die Firma.</p><!-- /wp:paragraph --></div></div><!-- /wp:media-text -->'
	. '<!-- wp:html --><div class="team-strip"><img src="' . $url( $ids['sawdust'], 'medium' ) . '" alt="Späne" width="300"></div><!-- /wp:html -->';
$about_id = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Über uns', 'post_content' => $about ) );
set_post_thumbnail( $about_id, $ids['kitchen'] );

$post_id = wp_insert_post( array( 'post_type' => 'post', 'post_status' => 'publish', 'post_title' => 'Neues Holz aus dem Wald', 'post_content' => '<!-- wp:paragraph --><p>Diese Woche kam frisches Eichenholz.</p><!-- /wp:paragraph -->' . $image_block( $ids['gemini'], 'Stämme kurz vor dem Transport' ) ) );
set_post_thumbnail( $post_id, $ids['gemini'] );

update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $front_id );
set_theme_mod( 'custom_logo', $ids['logo'] );
update_option( 'site_logo', $ids['logo'] );
update_option( 'blogname', 'Tischlerei Huber' );
update_option( 'blogdescription', 'Möbel aus Graz' );

echo wp_json_encode( $ids ) . "\n";
