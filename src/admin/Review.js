import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { api, boot, post, problem, query } from './api';
import { AssistantCard, Setup } from './Assistant';
import {
	CONTEXT_LABELS,
	Decide,
	EuIcon,
	HintLine,
	Promo,
	StateChip,
	Thumb,
	Traces,
	UsageLine,
} from './parts';
import {
	Button,
	Card,
	Chip,
	Drawer,
	Field,
	Icon,
	Notice,
	Section,
	Spinner,
	useDraft,
	when,
} from './ui';

/** The lists, in the order of their tabs. */
const LISTS = [
	[ 'suggested', __( 'Vorschläge', 'ai-act-labels' ) ],
	[ 'unchecked', __( 'Verwendet, nicht entschieden', 'ai-act-labels' ) ],
	[ 'labelled', __( 'Gekennzeichnet', 'ai-act-labels' ) ],
	[ 'none', __( 'Kein Hinweis nötig', 'ai-act-labels' ) ],
	[ 'all', __( 'Alle', 'ai-act-labels' ) ],
];

/** What each list says when it is empty. */
const EMPTY = {
	suggested: __(
		'Keine Datei trägt Spuren von KI ohne Entscheidung. Spuren fehlen oft – geh auch „Verwendet, nicht entschieden“ durch.',
		'ai-act-labels'
	),
	unchecked: __(
		'Alles, was auf deiner Website verwendet wird, hat eine Entscheidung. Oder die Website wurde noch nicht geprüft.',
		'ai-act-labels'
	),
	labelled: __( 'Noch keine Datei gekennzeichnet.', 'ai-act-labels' ),
	none: __( 'Noch keine Datei ohne Hinweis entschieden.', 'ai-act-labels' ),
	all: __( 'Keine Bilder, Videos oder Aufnahmen.', 'ai-act-labels' ),
};

/**
 * The numbers and the check of the whole site.
 * @param root0
 * @param root0.state
 * @param root0.onDone Called with the new counts when the check is through.
 */
function Overview( { state, onDone } ) {
	const c = state.counts;
	const [ run, setRun ] = useState( null );
	const [ error, setError ] = useState( null );
	const labelled = c.generated + c.modified;

	const step = useCallback(
		( first ) => {
			post( '/scan', { restart: first } )
				.then( ( p ) => {
					setRun( p );
					if ( p.phase === 'done' ) {
						onDone( p );
						window.setTimeout( () => setRun( null ), 1600 );
					} else {
						step( false );
					}
				} )
				.catch( ( e ) => {
					setError( problem( e ).message );
					setRun( null );
				} );
		},
		[ onDone ]
	);

	// A check that was cut off goes on.
	const resumed = useRef( false );
	useEffect( () => {
		if ( state.running && ! resumed.current ) {
			resumed.current = true;
			step( false );
		}
	}, [ state.running, step ] );

	const phase = run
		? {
				posts: __(
					'Liest deine Seiten und Beiträge …',
					'ai-act-labels'
				),
				files: __(
					'Liest die Spuren in deinen Dateien …',
					'ai-act-labels'
				),
				done: __( 'Fertig.', 'ai-act-labels' ),
		  }[ run.phase ]
		: '';
	const pct =
		run && run.total ? Math.round( ( run.done / run.total ) * 100 ) : 0;

	return (
		<div className="aal-overview">
			<div className="aal-overview__nums">
				<div className="aal-num">
					<span>{ labelled }</span>
					<p>
						{ __( 'gekennzeichnet', 'ai-act-labels' ) }
						<em>
							{ sprintf(
								/* translators: 1: generated count, 2: modified count */
								__(
									'%1$d KI-generiert · %2$d verändert',
									'ai-act-labels'
								),
								c.generated,
								c.modified
							) }
						</em>
					</p>
				</div>
				<div className={ `aal-num${ c.suggested ? ' is-open' : '' }` }>
					<span>{ c.suggested }</span>
					<p>
						{ __( 'Vorschläge', 'ai-act-labels' ) }
						<em>
							{ __(
								'Spuren von KI, keine Entscheidung',
								'ai-act-labels'
							) }
						</em>
					</p>
				</div>
				<div className={ `aal-num${ c.unchecked ? ' is-open' : '' }` }>
					<span>{ c.unchecked }</span>
					<p>
						{ __(
							'verwendet, nicht entschieden',
							'ai-act-labels'
						) }
						<em>
							{ __(
								'auf deiner Website zu sehen',
								'ai-act-labels'
							) }
						</em>
					</p>
				</div>
			</div>
			<div className="aal-overview__check">
				{ run ? (
					<>
						<span className="aal-fine">{ phase }</span>
						<span className="aal-bar">
							<i
								style={ {
									width: `${
										run.phase === 'done' ? 100 : pct
									}%`,
								} }
							/>
						</span>
					</>
				) : (
					<>
						<span className="aal-fine">
							{ state.last
								? sprintf(
										/* translators: 1: date, 2: pages, 3: files in use */
										__(
											'Zuletzt geprüft %1$s: %2$d Seiten und Beiträge, %3$d Dateien in Verwendung.',
											'ai-act-labels'
										),
										when( state.last.at ),
										state.last.posts,
										state.last.used
								  )
								: __(
										'Noch nicht geprüft: wo deine Medien verwendet werden und welche Spuren von KI sie tragen.',
										'ai-act-labels'
								  ) }
						</span>
						<Button
							kind={ state.last ? 'secondary' : 'primary' }
							icon="refresh"
							onClick={ () => step( true ) }
						>
							{ state.last
								? __( 'Neu prüfen', 'ai-act-labels' )
								: __( 'Website prüfen', 'ai-act-labels' ) }
						</Button>
					</>
				) }
				{ error ? <Notice tone="error">{ error }</Notice> : null }
			</div>
		</div>
	);
}

/**
 * One file in the list.
 * @param root0
 * @param root0.item
 * @param root0.busy
 * @param root0.onLabel
 * @param root0.onOpen
 * @param root0.onReview
 * @param root0.canReview
 * @param root0.reviewing
 */
function MediaRow( {
	item,
	busy,
	onLabel,
	onOpen,
	onReview,
	canReview,
	reviewing,
} ) {
	return (
		<div className={ `aal-mrow is-${ item.state || 'open' }` }>
			<button
				type="button"
				className="aal-mrow__main"
				onClick={ () => onOpen( item ) }
			>
				<Thumb item={ item } />
				<span className="aal-mrow__t">
					<b>
						{ item.title || item.file }
						<i>{ item.file }</i>
					</b>
					<UsageLine usage={ item.usage } />
					<Traces signals={ item.signals } />
					<HintLine hint={ item.hint } />
				</span>
			</button>
			<span className="aal-mrow__right">
				<Decide
					value={ item.state }
					suggests={ item.suggests }
					busy={ busy }
					onChange={ ( s ) => onLabel( [ item.id ], s ) }
				/>
				{ canReview ? (
					<Button
						kind="ghost"
						size="sm"
						icon="sparkle"
						busy={ reviewing }
						onClick={ () => onReview( item ) }
					>
						{ item.hint
							? __( 'Neu einschätzen', 'ai-act-labels' )
							: __( 'Einschätzen', 'ai-act-labels' ) }
					</Button>
				) : null }
			</span>
		</div>
	);
}

/** What a check of a page found. */
const CHECKS = {
	shown: [ 'moss', __( 'Hinweis sichtbar', 'ai-act-labels' ) ],
	missing: [ 'rose', __( 'Bild ohne Hinweis', 'ai-act-labels' ) ],
	absent: [ '', __( 'nicht auf der Seite', 'ai-act-labels' ) ],
	error: [ 'amber', __( 'Seite nicht erreichbar', 'ai-act-labels' ) ],
};

/**
 * Everything about one file.
 * @param root0
 * @param root0.item
 * @param root0.state
 * @param root0.onClose
 * @param root0.onItem  Called with the updated file.
 * @param root0.onLabel
 */
function Details( { item, state, onClose, onItem, onLabel } ) {
	const [ busy, setBusy ] = useState( '' );
	const [ error, setError ] = useState( null );
	const assistant = state.assistant;
	const save = ( extra ) =>
		post( '/label', { ids: [ item.id ], state: item.state, ...extra } )
			.then( ( r ) => r.items[ 0 ] && onItem( r.items[ 0 ] ) )
			.catch( ( e ) => setError( problem( e ).message ) );
	const [ tool, setTool ] = useDraft( item.tool, ( v ) =>
		save( { tool: v } )
	);
	const [ notice, setNotice ] = useDraft( item.notice, ( v ) =>
		save( { notice: v } )
	);
	const run = ( what, path ) => {
		setBusy( what );
		setError( null );
		post( path, { id: item.id } )
			.then( ( r ) => onItem( r.item ) )
			.catch( ( e ) => setError( problem( e ).message ) )
			.finally( () => setBusy( '' ) );
	};
	const labelled = item.state === 'generated' || item.state === 'modified';
	const manual = ( item.usage || [] ).some( ( u ) => ! u.auto );

	return (
		<Drawer
			title={ item.title || item.file }
			head={ <Thumb item={ item } size={ 40 } /> }
			onClose={ onClose }
			footer={
				<>
					<Button kind="ghost" size="sm" href={ item.edit }>
						{ __( 'In der Mediathek öffnen', 'ai-act-labels' ) }
					</Button>
					<span className="aal-fine">{ item.file }</span>
				</>
			}
		>
			{ error ? <Notice tone="error">{ error }</Notice> : null }
			<div className="aal-dpreview">
				{ item.type === 'image' ? (
					<img src={ item.full || item.thumb } alt={ item.alt } />
				) : item.type === 'video' ? (
					// eslint-disable-next-line jsx-a11y/media-has-caption -- a preview of the file.
					<video src={ item.full } controls preload="metadata" />
				) : (
					// eslint-disable-next-line jsx-a11y/media-has-caption -- a preview of the file.
					<audio src={ item.full } controls preload="metadata" />
				) }
				{ labelled && item.type !== 'audio' ? (
					<EuIcon
						name={
							state.settings.icon === 'official'
								? item.state
								: 'basic'
						}
						className={ `aal-dpreview__icon is-${ state.settings.position }` }
					/>
				) : null }
			</div>

			<Section title={ __( 'Entscheidung', 'ai-act-labels' ) }>
				<Decide
					value={ item.state }
					suggests={ item.suggests }
					onChange={ ( s ) => onLabel( [ item.id ], s ) }
				/>
				{ labelled ? (
					<p className="aal-small">
						{ __( 'Auf der Website steht:', 'ai-act-labels' ) }{ ' ' }
						<b>„{ item.shown }“</b>
					</p>
				) : null }
				{ item.legacy ? (
					<span className="aal-fine">
						{ __(
							'Aus der ersten Version im Theme übernommen. Wähl eine Art, damit die Entscheidung hier gespeichert ist.',
							'ai-act-labels'
						) }
					</span>
				) : null }
				{ labelled ? (
					<div className="aal-grid2">
						<Field
							label={ __( 'KI-Werkzeug', 'ai-act-labels' ) }
							hint={ __(
								'Optional, steht dann im Hinweis.',
								'ai-act-labels'
							) }
						>
							<input
								type="text"
								value={ tool }
								placeholder={
									item.signals?.tool ||
									__( 'z. B. Midjourney', 'ai-act-labels' )
								}
								onChange={ ( e ) => setTool( e.target.value ) }
							/>
						</Field>
						<Field
							label={ __( 'Eigener Hinweis', 'ai-act-labels' ) }
							hint={ __(
								'Leer: der Standard der Art.',
								'ai-act-labels'
							) }
						>
							<input
								type="text"
								value={ notice }
								placeholder={ item.hint?.notice || '' }
								onChange={ ( e ) =>
									setNotice( e.target.value )
								}
							/>
						</Field>
					</div>
				) : null }
			</Section>

			<Section
				title={ __( 'Einschätzung des Assistenten', 'ai-act-labels' ) }
				aside={
					assistant.ready ? (
						<Button
							size="sm"
							icon="sparkle"
							busy={ busy === 'review' }
							onClick={ () => run( 'review', '/review' ) }
						>
							{ item.hint
								? __( 'Neu einschätzen', 'ai-act-labels' )
								: __( 'Einschätzen', 'ai-act-labels' ) }
						</Button>
					) : null
				}
			>
				{ ! assistant.ready ? (
					<Setup assistant={ assistant } compact />
				) : item.hint ? (
					<div className="aal-mini">
						<HintLine hint={ item.hint } />
						<span className="aal-row-inline">
							{ item.hint.kind && item.hint.kind !== 'unsure' ? (
								<StateChip state={ item.hint.kind } />
							) : null }
							{ item.hint.deepfake === 'yes' ? (
								<Chip tone="rose">
									{ __( 'Deepfake', 'ai-act-labels' ) }
								</Chip>
							) : null }
							<span className="aal-fine">
								{ item.hint.seen
									? __(
											'mit Blick aufs Bild',
											'ai-act-labels'
									  )
									: __(
											'ohne Blick aufs Bild',
											'ai-act-labels'
									  ) }
								{ item.hint.model
									? ` · ${ item.hint.model }`
									: '' }
							</span>
						</span>
					</div>
				) : (
					<p className="aal-fine">
						{ __(
							'Der Assistent sieht sich das Bild, seine Spuren und die Seiten an, auf denen es steht, und sagt, ob ein Hinweis Pflicht ist.',
							'ai-act-labels'
						) }
					</p>
				) }
			</Section>

			<Section title={ __( 'Spuren in der Datei', 'ai-act-labels' ) }>
				{ item.signals?.items?.length ? (
					<Traces signals={ item.signals } max={ 10 } />
				) : (
					<p className="aal-fine">
						{ __(
							'Keine Spuren gefunden. Das heißt nicht, dass keine KI im Spiel war – nach einem Screenshot oder Export fehlen sie meist.',
							'ai-act-labels'
						) }
					</p>
				) }
			</Section>

			<Section
				title={ __( 'Wo es verwendet wird', 'ai-act-labels' ) }
				aside={
					labelled && item.usage?.length ? (
						<Button
							size="sm"
							icon="eye"
							busy={ busy === 'verify' }
							onClick={ () => run( 'verify', '/verify' ) }
						>
							{ __( 'Auf der Website prüfen', 'ai-act-labels' ) }
						</Button>
					) : null
				}
			>
				{ item.usage?.length ? (
					<Card pad0>
						{ item.usage.map( ( u, i ) => (
							<div className="aal-row" key={ i }>
								<span className="aal-row__main">
									<span className="aal-row__t">
										<b>
											{ u.url ? (
												<a
													href={ u.url }
													target="_blank"
													rel="noreferrer"
												>
													{ u.title }
												</a>
											) : (
												u.title
											) }
										</b>
										<span>
											{ u.type } ·{ ' ' }
											{ CONTEXT_LABELS[ u.context ] ||
												u.context }
										</span>
									</span>
								</span>
								<span className="aal-row__right">
									{ u.check && CHECKS[ u.check ] ? (
										<Chip tone={ CHECKS[ u.check ][ 0 ] }>
											{ CHECKS[ u.check ][ 1 ] }
										</Chip>
									) : ! u.auto ? (
										<Chip tone="amber">
											{ __(
												'Hinweis prüfen',
												'ai-act-labels'
											) }
										</Chip>
									) : null }
								</span>
							</div>
						) ) }
					</Card>
				) : (
					<p className="aal-fine">
						{ __(
							'Auf keiner Seite gefunden. Prüf die Website, wenn du sie zuletzt geändert hast.',
							'ai-act-labels'
						) }
					</p>
				) }
				{ manual ? (
					<span className="aal-fine">
						{ __(
							'„Hinweis prüfen“: dort steht die Datei nur als Adresse oder in einem Page Builder. „Auf der Website prüfen“ zeigt, ob der Hinweis trotzdem erscheint; sonst gehört ai_act_labels_wrap() ins Theme.',
							'ai-act-labels'
						) }
					</span>
				) : null }
			</Section>
		</Drawer>
	);
}

/**
 * Prüfen: the numbers, the assistant, the files by list.
 * @param root0
 * @param root0.state
 * @param root0.setState
 * @param root0.initial  The list to start with.
 */
export default function Review( { state, setState, initial } ) {
	const firstList =
		initial && LISTS.some( ( [ k ] ) => k === initial )
			? initial
			: state.counts.suggested
			? 'suggested'
			: state.counts.unchecked
			? 'unchecked'
			: 'all';
	const [ list, setList ] = useState( firstList );
	const [ search, setSearch ] = useState( '' );
	const [ page, setPage ] = useState( 1 );
	const [ data, setData ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ busy, setBusy ] = useState( {} );
	const [ open, setOpen ] = useState( null );
	const [ reviewing, setReviewing ] = useState( {} );
	const [ batch, setBatch ] = useState( null );

	const load = useCallback( () => {
		api( `/media${ query( { filter: list, search, page, per: 24 } ) }` )
			.then( setData )
			.catch( ( e ) => setError( problem( e ).message ) );
	}, [ list, search, page ] );

	useEffect( () => {
		const t = window.setTimeout( load, search ? 300 : 0 );
		return () => window.clearTimeout( t );
	}, [ load, search ] );

	const replace = ( items ) => {
		setData( ( d ) =>
			d
				? {
						...d,
						items: d.items.map(
							( it ) =>
								items.find( ( n ) => n.id === it.id ) || it
						),
				  }
				: d
		);
		setOpen( ( o ) =>
			o ? items.find( ( n ) => n.id === o.id ) || o : o
		);
	};

	const label = ( ids, st, via = 'manual' ) => {
		setBusy( ( b ) => ( {
			...b,
			...Object.fromEntries( ids.map( ( id ) => [ id, true ] ) ),
		} ) );
		return post( '/label', { ids, state: st, via } )
			.then( ( r ) => {
				replace( r.items );
				setState( ( s ) => ( { ...s, counts: r.counts } ) );
			} )
			.catch( ( e ) => setError( problem( e ).message ) )
			.finally( () =>
				setBusy( ( b ) => {
					const n = { ...b };
					ids.forEach( ( id ) => delete n[ id ] );
					return n;
				} )
			);
	};

	const review = ( item ) => {
		setReviewing( ( r ) => ( { ...r, [ item.id ]: true } ) );
		return post( '/review', { id: item.id } )
			.then( ( r ) => {
				replace( [ r.item ] );
				setState( ( s ) => ( { ...s, counts: r.counts } ) );
			} )
			.catch( ( e ) => setError( problem( e ).message ) )
			.finally( () =>
				setReviewing( ( r ) => {
					const n = { ...r };
					delete n[ item.id ];
					return n;
				} )
			);
	};

	/** The assistant looks at every file of the page without an assessment, one after another. */
	const reviewAll = async () => {
		const todo = ( data?.items || [] ).filter(
			( i ) => ! i.hint && ! i.state
		);
		setBatch( { done: 0, total: todo.length } );
		for ( const [ n, item ] of todo.entries() ) {
			// eslint-disable-next-line no-await-in-loop -- one request after another, the provider limits.
			await review( item );
			setBatch( { done: n + 1, total: todo.length } );
		}
		setBatch( null );
	};

	const onScanned = useCallback(
		( p ) => {
			setState( ( s ) => ( {
				...s,
				counts: p.counts,
				last: p.last,
				running: false,
			} ) );
			load();
		},
		[ setState, load ]
	);

	const counts = state.counts;
	const countOf = {
		suggested: counts.suggested,
		unchecked: counts.unchecked,
		labelled: counts.generated + counts.modified,
		none: counts.none,
	};
	const unassessed = ( data?.items || [] ).filter(
		( i ) => ! i.hint && ! i.state
	).length;

	return (
		<>
			<Overview state={ state } onDone={ onScanned } />
			<AssistantCard
				state={ state }
				onLabel={ label }
				onOpen={ ( m ) => setOpen( m ) }
			/>
			<Section
				title={ __( 'Medien', 'ai-act-labels' ) }
				hint={ __(
					'Entscheide pro Datei: KI-generiert, mit KI verändert oder kein Hinweis nötig. Pflicht ist der Hinweis, wenn etwas echt wirkt, das es so nicht gab.',
					'ai-act-labels'
				) }
				aside={
					<span className="aal-searchbox">
						<Icon name="search" size={ 15 } />
						<input
							type="search"
							value={ search }
							placeholder={ __( 'Suchen', 'ai-act-labels' ) }
							aria-label={ __(
								'Medien suchen',
								'ai-act-labels'
							) }
							onChange={ ( e ) => {
								setSearch( e.target.value );
								setPage( 1 );
							} }
						/>
					</span>
				}
			>
				<div className="aal-toolbar">
					<div className="aal-tabs" role="tablist">
						{ LISTS.map( ( [ key, name ] ) => (
							<button
								key={ key }
								type="button"
								role="tab"
								aria-selected={
									list === key ? 'true' : 'false'
								}
								className={ list === key ? 'is-on' : '' }
								onClick={ () => {
									setList( key );
									setPage( 1 );
								} }
							>
								{ name }
								{ countOf[ key ] ? (
									<span className="aal-count">
										{ countOf[ key ] }
									</span>
								) : null }
							</button>
						) ) }
					</div>
					{ state.assistant.ready && unassessed > 1 ? (
						<Button
							size="sm"
							icon="sparkle"
							busy={ !! batch }
							onClick={ reviewAll }
						>
							{ batch
								? sprintf(
										/* translators: 1: done, 2: total */
										__(
											'Schätzt ein … %1$d von %2$d',
											'ai-act-labels'
										),
										batch.done,
										batch.total
								  )
								: sprintf(
										/* translators: %d: number of files */
										_n(
											'%d Datei einschätzen lassen',
											'%d Dateien einschätzen lassen',
											unassessed,
											'ai-act-labels'
										),
										unassessed
								  ) }
						</Button>
					) : null }
				</div>
				{ error ? <Notice tone="error">{ error }</Notice> : null }
				{ ! data ? (
					<Spinner label={ __( 'Lädt …', 'ai-act-labels' ) } />
				) : data.items.length ? (
					<Card pad0>
						{ data.items.map( ( item ) => (
							<MediaRow
								key={ item.id }
								item={ item }
								busy={ !! busy[ item.id ] }
								onLabel={ label }
								onOpen={ setOpen }
								onReview={ review }
								canReview={ state.assistant.ready }
								reviewing={ !! reviewing[ item.id ] }
							/>
						) ) }
					</Card>
				) : (
					<div className="aal-empty">
						<EuIcon name="basic" />
						<p>{ EMPTY[ list ] }</p>
					</div>
				) }
				{ data && data.pages > 1 ? (
					<div className="aal-row-inline aal-pager">
						<Button
							size="sm"
							disabled={ page <= 1 }
							onClick={ () => setPage( page - 1 ) }
						>
							←
						</Button>
						<span className="aal-fine">
							{ sprintf(
								/* translators: 1: page, 2: pages */
								__( 'Seite %1$d von %2$d', 'ai-act-labels' ),
								page,
								data.pages
							) }
						</span>
						<Button
							size="sm"
							disabled={ page >= data.pages }
							onClick={ () => setPage( page + 1 ) }
						>
							→
						</Button>
					</div>
				) : null }
				<span className="aal-fine">
					{ __(
						'Auch in der Mediathek: Filter „KI“, Spalte und Sammelaktionen in der Listenansicht.',
						'ai-act-labels'
					) }{ ' ' }
					<a href={ boot.upload }>
						{ __( 'Mediathek öffnen', 'ai-act-labels' ) }
					</a>
				</span>
			</Section>
			<Promo wizards={ state.wizards } />
			{ open ? (
				<Details
					item={ open }
					state={ state }
					onClose={ () => setOpen( null ) }
					onItem={ ( it ) => replace( [ it ] ) }
					onLabel={ label }
				/>
			) : null }
		</>
	);
}
