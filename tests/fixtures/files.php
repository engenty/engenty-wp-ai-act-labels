<?php
/**
 * Test files: simple pictures drawn with GD, with the traces AI tools leave – XMP with an IPTC digital
 * source type, a C2PA box, the generation data of Stable Diffusion.
 *
 * @package AI_Act_Labels
 */

// phpcs:disable

class AI_Act_Labels_Test_Files {

	/**
	 * A flat picture of a scene.
	 */
	public static function scene( $kind, $w = 800, $h = 600 ) {
		$im  = imagecreatetruecolor( $w, $h );
		$c   = static fn( $hex ) => imagecolorallocate( $im, hexdec( substr( $hex, 0, 2 ) ), hexdec( substr( $hex, 2, 2 ) ), hexdec( substr( $hex, 4, 2 ) ) );
		$box = static fn( $x1, $y1, $x2, $y2, $col ) => imagefilledrectangle( $im, (int) ( $x1 * $w ), (int) ( $y1 * $h ), (int) ( $x2 * $w ), (int) ( $y2 * $h ), $col );
		$dot = static fn( $x, $y, $r, $col ) => imagefilledellipse( $im, (int) ( $x * $w ), (int) ( $y * $h ), (int) ( $r * $w ), (int) ( $r * $w ), $col );
		switch ( $kind ) {
			case 'dusk':
				foreach ( array( 'f2b880', 'e89b6c', 'cf7a63', 'a35d6a', '6b4a6e' ) as $i => $col ) {
					$box( 0, $i * 0.14, 1, ( $i + 1 ) * 0.14, $c( $col ) );
				}
				$box( 0, 0.7, 1, 1, $c( '3b3a36' ) );
				$box( 0.2, 0.42, 0.62, 0.8, $c( '2b2a27' ) );
				imagefilledpolygon( $im, array( (int) ( 0.17 * $w ), (int) ( 0.44 * $h ), (int) ( 0.41 * $w ), (int) ( 0.22 * $h ), (int) ( 0.65 * $w ), (int) ( 0.44 * $h ) ), $c( '2b2a27' ) );
				foreach ( array( 0.27, 0.39, 0.51 ) as $x ) {
					$box( $x, 0.5, $x + 0.07, 0.62, $c( 'ffcf7a' ) );
				}
				$dot( 0.82, 0.22, 0.07, $c( 'ffe2a8' ) );
				break;
			case 'team':
				$box( 0, 0, 1, 1, $c( 'e9dfd1' ) );
				$box( 0, 0.72, 1, 1, $c( 'b48a5a' ) );
				foreach ( array( array( 0.28, 'c2553d' ), array( 0.5, '3f6d8c' ), array( 0.72, '58784a' ) ) as $p ) {
					$dot( $p[0], 0.62, 0.2, $c( $p[1] ) );
					$box( $p[0] - 0.1, 0.62, $p[0] + 0.1, 0.9, $c( $p[1] ) );
					$dot( $p[0], 0.36, 0.11, $c( 'e8b896' ) );
					$dot( $p[0], 0.3, 0.11, $c( '4a3426' ) );
					$dot( $p[0], 0.39, 0.09, $c( 'e8b896' ) );
				}
				$box( 0.1, 0.78, 0.9, 0.83, $c( '8d6a42' ) );
				break;
			case 'kitchen':
				$box( 0, 0, 1, 1, $c( 'f1ece4' ) );
				$box( 0, 0.55, 1, 1, $c( 'c9b28f' ) );
				$box( 0.05, 0.3, 0.95, 0.55, $c( 'b98d5b' ) );
				$box( 0.05, 0.28, 0.95, 0.31, $c( '6f6a64' ) );
				$box( 0.3, 0.6, 0.7, 0.85, $c( 'a8794a' ) );
				$box( 0.28, 0.58, 0.72, 0.62, $c( '6f6a64' ) );
				foreach ( array( 0.38, 0.5, 0.62 ) as $x ) {
					$box( $x - 0.002, 0, $x + 0.002, 0.14, $c( '333333' ) );
					$dot( $x, 0.16, 0.05, $c( 'f2c14e' ) );
				}
				break;
			case 'forest':
				$box( 0, 0, 1, 1, $c( 'cfe0c3' ) );
				for ( $i = 0; $i < 9; $i++ ) {
					$x = 0.06 + $i * 0.11;
					$dot( $x + 0.03, 0.25 + ( $i % 3 ) * 0.04, 0.16, $c( $i % 2 ? '4f7a4a' : '3d6340' ) );
					$box( $x + 0.02, 0.3, $x + 0.04, 0.85, $c( '6b4a32' ) );
				}
				$box( 0, 0.85, 1, 1, $c( '5d4a33' ) );
				break;
			case 'bench':
				$box( 0, 0, 1, 1, $c( 'ddd5c9' ) );
				$box( 0.1, 0.4, 0.9, 0.5, $c( '9a6b3f' ) );
				$box( 0.15, 0.5, 0.2, 0.88, $c( '7d5531' ) );
				$box( 0.8, 0.5, 0.85, 0.88, $c( '7d5531' ) );
				$box( 0.15, 0.75, 0.85, 0.78, $c( '7d5531' ) );
				break;
			case 'chair':
				$box( 0, 0, 1, 1, $c( 'faf8f4' ) );
				imagesetthickness( $im, max( 2, (int) ( $w / 200 ) ) );
				$ink = $c( '3a3a3a' );
				foreach ( array( array( 0.3, 0.2, 0.3, 0.85 ), array( 0.7, 0.2, 0.7, 0.85 ), array( 0.3, 0.55, 0.7, 0.55 ), array( 0.3, 0.2, 0.7, 0.2 ), array( 0.3, 0.32, 0.7, 0.32 ) ) as $l ) {
					imageline( $im, (int) ( $l[0] * $w ), (int) ( $l[1] * $h ), (int) ( $l[2] * $w ), (int) ( $l[3] * $h ), $ink );
				}
				break;
			case 'sawdust':
				$box( 0, 0, 1, 1, $c( '8a7356' ) );
				mt_srand( 7 );
				for ( $i = 0; $i < 400; $i++ ) {
					imagefilledellipse( $im, mt_rand( 0, $w ), mt_rand( 0, $h ), mt_rand( 6, 22 ), mt_rand( 3, 8 ), $c( mt_rand( 0, 1 ) ? 'e3c99a' : 'cfae7a' ) );
				}
				break;
			case 'logo':
				$box( 0, 0, 1, 1, $c( 'ffffff' ) );
				$dot( 0.5, 0.5, 0.8, $c( '2f4a3a' ) );
				$box( 0.36, 0.3, 0.42, 0.7, $c( 'ffffff' ) );
				$box( 0.58, 0.3, 0.64, 0.7, $c( 'ffffff' ) );
				$box( 0.36, 0.47, 0.64, 0.53, $c( 'ffffff' ) );
				break;
			default:
				$box( 0, 0, 1, 1, $c( 'cccccc' ) );
		}
		return $im;
	}

	public static function png( $im ) {
		ob_start();
		imagepng( $im );
		return (string) ob_get_clean();
	}

	public static function jpeg( $im ) {
		ob_start();
		imagejpeg( $im, null, 85 );
		return (string) ob_get_clean();
	}

	/** A PNG with one tEXt chunk after IHDR. */
	public static function png_with_text( $im, $key, $text ) {
		$png   = self::png( $im );
		$data  = $key . "\0" . $text;
		$chunk = pack( 'N', strlen( $data ) ) . 'tEXt' . $data . pack( 'N', crc32( 'tEXt' . $data ) );
		$ihdr  = 8 + 8 + 13 + 4;
		return substr( $png, 0, $ihdr ) . $chunk . substr( $png, $ihdr );
	}

	/** The XMP packet with an IPTC digital source type. */
	public static function xmp( $code ) {
		return '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/' . $code . '"/></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
	}

	/** A JPEG with an APP1 XMP segment. */
	public static function jpeg_with_xmp( $im, $code ) {
		$jpg  = self::jpeg( $im );
		$data = "http://ns.adobe.com/xap/1.0/\0" . self::xmp( $code );
		return substr( $jpg, 0, 2 ) . "\xFF\xE1" . pack( 'n', strlen( $data ) + 2 ) . $data . substr( $jpg, 2 );
	}

	/** A JPEG with an APP11 segment shaped like a C2PA JUMBF box. */
	public static function jpeg_with_c2pa( $im, $code, $generator ) {
		$jpg      = self::jpeg( $im );
		$manifest = 'jumb' . 'jumdc2pa' . "\0" . 'c2pa.claim' . 'claim_generator' . "\x78" . $generator . 'c2pa.actions' . 'action' . 'c2pa.edited' . 'digitalSourceType' . 'http://cv.iptc.org/newscodes/digitalsourcetype/' . $code;
		$data     = 'JP' . "\x00\x01" . "\x00\x00\x00\x01" . pack( 'N', strlen( $manifest ) + 8 ) . $manifest;
		return substr( $jpg, 0, 2 ) . "\xFF\xEB" . pack( 'n', strlen( $data ) + 2 ) . $data . substr( $jpg, 2 );
	}
}
