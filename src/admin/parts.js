import { __, sprintf } from '@wordpress/i18n';
import { boot } from './api';
import { Button, Chip, Engenty, Icon } from './ui';

export const STATE_LABELS = {
	generated: __( 'KI-generiert', 'ai-act-labels' ),
	modified: __( 'Mit KI verändert', 'ai-act-labels' ),
	none: __( 'Kein Hinweis nötig', 'ai-act-labels' ),
	'': __( 'Nicht entschieden', 'ai-act-labels' ),
};

/** Where a file is used, in words; `auto`: the label comes there by itself. */
export const CONTEXT_LABELS = {
	featured: __( 'Beitragsbild', 'ai-act-labels' ),
	image: __( 'Bild', 'ai-act-labels' ),
	gallery: __( 'Galerie', 'ai-act-labels' ),
	cover: __( 'Cover', 'ai-act-labels' ),
	'media-text': __( 'Medien und Text', 'ai-act-labels' ),
	video: __( 'Video', 'ai-act-labels' ),
	audio: __( 'Audio', 'ai-act-labels' ),
	url: __( 'nur als Adresse', 'ai-act-labels' ),
	builder: __( 'Page Builder', 'ai-act-labels' ),
	shop: __( 'Produktgalerie', 'ai-act-labels' ),
	logo: __( 'Logo', 'ai-act-labels' ),
	icon: __( 'Website-Icon', 'ai-act-labels' ),
	header: __( 'Kopfbild', 'ai-act-labels' ),
};

/**
 * Inline SVG of one of the EU icons, from PHP.
 * @param root0
 * @param root0.name      basic, generated, modified, sparkle.
 * @param root0.className
 */
export function EuIcon( { name, className = '' } ) {
	return (
		<span
			className={ `aal-eu ${ className }` }
			aria-hidden="true"
			// eslint-disable-next-line react/no-danger -- the Commission's paths, rendered by PHP.
			dangerouslySetInnerHTML={ { __html: boot.icons?.[ name ] || '' } }
		/>
	);
}

/**
 * The plugin's mark: the round engenty with the EU's AI icon as a sticker, away from its one eye.
 * @param root0
 * @param root0.size
 */
export function Mark( { size = 28 } ) {
	return (
		<span className="aal-mark" style={ { width: size, height: size } }>
			<Engenty kind="round" size={ size } />
			<EuIcon name="basic" className="aal-mark__ai" />
		</span>
	);
}

export function StateChip( { state } ) {
	if ( state === 'generated' || state === 'modified' ) {
		return (
			<span className={ `aal-state is-${ state }` }>
				<EuIcon name="basic" />
				{ STATE_LABELS[ state ] }
			</span>
		);
	}
	if ( state === 'none' ) {
		return <Chip>{ STATE_LABELS.none }</Chip>;
	}
	return <Chip tone="amber">{ STATE_LABELS[ '' ] }</Chip>;
}

/**
 * A file's picture, or its type for video and audio.
 * @param root0
 * @param root0.item
 * @param root0.size
 */
export function Thumb( { item, size = 64 } ) {
	const style = { width: size, height: size };
	if ( item.type === 'image' && item.thumb ) {
		return (
			<span className="aal-thumb" style={ style }>
				<img src={ item.thumb } alt="" loading="lazy" />
			</span>
		);
	}
	return (
		<span className="aal-thumb is-file" style={ style }>
			<Icon
				name={ item.type === 'audio' ? 'audio' : 'play' }
				size={ 20 }
			/>
		</span>
	);
}

/**
 * The decision as three buttons.
 * @param root0
 * @param root0.value    The decision.
 * @param root0.suggests What the plugin suggests (marked).
 * @param root0.onChange Called with the new decision ('' when the current one is clicked again).
 * @param root0.busy
 */
export function Decide( { value, suggests, onChange, busy = false } ) {
	return (
		<span
			className="aal-decide"
			role="radiogroup"
			aria-label={ __( 'KI-Kennzeichnung', 'ai-act-labels' ) }
		>
			{ [ 'generated', 'modified', 'none' ].map( ( s ) => (
				<button
					key={ s }
					type="button"
					role="radio"
					aria-checked={ value === s ? 'true' : 'false' }
					className={ `is-${ s }${ value === s ? ' is-on' : '' }${
						! value && suggests === s ? ' is-suggested' : ''
					}` }
					disabled={ busy }
					onClick={ () => onChange( value === s ? '' : s ) }
					title={
						! value && suggests === s
							? __( 'Vorschlag', 'ai-act-labels' )
							: undefined
					}
				>
					{ s !== 'none' ? <EuIcon name="basic" /> : null }
					{ STATE_LABELS[ s ] }
				</button>
			) ) }
		</span>
	);
}

/**
 * The traces found in a file, as chips.
 * @param root0
 * @param root0.signals
 * @param root0.max
 */
export function Traces( { signals, max = 3 } ) {
	const items = ( signals?.items || [] ).filter( ( i ) => i.label );
	if ( ! items.length ) {
		return null;
	}
	return (
		<span className="aal-traces">
			{ items.slice( 0, max ).map( ( i, n ) => (
				<Chip
					key={ n }
					tone={
						i.kind === 'human'
							? 'moss'
							: i.strength === 'strong'
							? 'ember'
							: 'amber'
					}
					icon={ i.kind === 'human' ? 'check' : 'chip' }
				>
					{ i.label }
				</Chip>
			) ) }
		</span>
	);
}

/** The assistant's assessment in words. */
const DUTY = {
	required: __( 'Hinweis Pflicht', 'ai-act-labels' ),
	voluntary: __( 'Hinweis freiwillig', 'ai-act-labels' ),
	none: __( 'kein Hinweis nötig', 'ai-act-labels' ),
	unsure: __( 'unklar', 'ai-act-labels' ),
};

export function HintLine( { hint } ) {
	if ( ! hint?.reason ) {
		return null;
	}
	return (
		<span className="aal-hint">
			<Engenty kind="drop" size={ 18 } />
			<span>
				<b className={ `is-${ hint.duty }` }>
					{ DUTY[ hint.duty ] || '' }
				</b>{ ' ' }
				{ hint.reason }
				{ hint.question ? <em> { hint.question }</em> : null }
			</span>
		</span>
	);
}

/**
 * Where a file is used, in one line.
 * @param root0
 * @param root0.usage
 */
export function UsageLine( { usage } ) {
	if ( ! usage?.length ) {
		return (
			<span className="aal-fine">
				{ __( 'Auf keiner Seite gefunden', 'ai-act-labels' ) }
			</span>
		);
	}
	const shown = usage.slice( 0, 3 );
	return (
		<span className="aal-usage">
			{ shown.map( ( u, i ) => (
				<span key={ i } className={ u.auto ? '' : 'is-manual' }>
					{ u.title }{ ' ' }
					<i>({ CONTEXT_LABELS[ u.context ] || u.context })</i>
					{ i < shown.length - 1 ? ', ' : '' }
				</span>
			) ) }
			{ usage.length > 3 ? ' ' : '' }
			{ usage.length > 3
				? sprintf(
						/* translators: %d: number of further places */
						__( 'und %d weitere', 'ai-act-labels' ),
						usage.length - 3
				  )
				: '' }
		</span>
	);
}

/**
 * engenty wizards, from the makers of this plugin.
 * @param root0
 * @param root0.wizards Whether the plugin is installed or active, its links.
 */
export function Promo( { wizards } ) {
	if ( ! wizards ) {
		return null;
	}
	return (
		<aside className="aal-promo">
			<Engenty kind="flame" size={ 40 } />
			<div className="aal-promo__t">
				<span className="aal-kick">
					{ __(
						'Von engenty, den Machern dieses Plugins',
						'ai-act-labels'
					) }
				</span>
				<b>
					{ __(
						'engenty wizards: geführte Abläufe für deine Besucher',
						'ai-act-labels'
					) }
				</b>
				<p>
					{ __(
						'Anfragen, Angebote, Termine – Schritt für Schritt auf deiner Website, mit KI gebaut statt programmiert.',
						'ai-act-labels'
					) }
				</p>
			</div>
			{ wizards.active ? (
				<Button size="sm" href={ wizards.open }>
					{ __( 'Öffnen', 'ai-act-labels' ) }
				</Button>
			) : (
				<span className="aal-row-inline">
					<Button size="sm" href={ wizards.install }>
						{ __( 'Plugin ansehen', 'ai-act-labels' ) }
					</Button>
					<Button
						kind="ghost"
						size="sm"
						href="https://engenty.ai/"
						external
					>
						engenty.ai
					</Button>
				</span>
			) }
		</aside>
	);
}
