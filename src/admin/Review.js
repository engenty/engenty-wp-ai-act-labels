import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { api, boot, post, problem, query } from './api';
import { SetupDialog } from './Assistant';
import {
	Decide,
	EuIcon,
	HintLine,
	Promo,
	Thumb,
	Traces,
	UsageLine,
} from './parts';
import { Button, Card, Icon, Notice, Section, Spinner, when } from './ui';

/** The lists, in the order of their tabs. */
const LISTS = [
	[ 'suggested', __( 'Suggestions', 'ai-act-labels' ) ],
	[ 'unchecked', __( 'Used, not decided', 'ai-act-labels' ) ],
	[ 'labelled', __( 'Labeled', 'ai-act-labels' ) ],
	[ 'none', __( 'No label needed', 'ai-act-labels' ) ],
	[ 'all', __( 'All', 'ai-act-labels' ) ],
];

/** What each list says when it is empty. */
const EMPTY = {
	suggested: __(
		'No file carries traces of AI without a decision. Traces are often missing – go through “Used, not decided” too.',
		'ai-act-labels'
	),
	unchecked: __(
		'Everything used on your site has a decision. Or the site has not been checked yet.',
		'ai-act-labels'
	),
	labelled: __( 'No file labeled yet.', 'ai-act-labels' ),
	none: __( 'No file decided as needing no label yet.', 'ai-act-labels' ),
	all: __( 'No images, videos or recordings.', 'ai-act-labels' ),
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
				posts: __( 'Reading your pages and posts …', 'ai-act-labels' ),
				files: __(
					'Reading the traces in your files …',
					'ai-act-labels'
				),
				done: __( 'Done.', 'ai-act-labels' ),
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
						{ __( 'labeled', 'ai-act-labels' ) }
						<em>
							{ sprintf(
								/* translators: 1: generated count, 2: modified count */
								__(
									'%1$d AI-generated · %2$d modified',
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
						{ __( 'Suggestions', 'ai-act-labels' ) }
						<em>
							{ __(
								'traces of AI, no decision',
								'ai-act-labels'
							) }
						</em>
					</p>
				</div>
				<div className={ `aal-num${ c.unchecked ? ' is-open' : '' }` }>
					<span>{ c.unchecked }</span>
					<p>
						{ __( 'used, not decided', 'ai-act-labels' ) }
						<em>
							{ __( 'visible on your site', 'ai-act-labels' ) }
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
											'Last checked %1$s: %2$d pages and posts, %3$d files in use.',
											'ai-act-labels'
										),
										when( state.last.at ),
										state.last.posts,
										state.last.used
								  )
								: __(
										'Not checked yet: where your media is used and which traces of AI it carries.',
										'ai-act-labels'
								  ) }
						</span>
						<Button
							kind={ state.last ? 'secondary' : 'primary' }
							icon="refresh"
							onClick={ () => step( true ) }
						>
							{ state.last
								? __( 'Check again', 'ai-act-labels' )
								: __( 'Check site', 'ai-act-labels' ) }
						</Button>
					</>
				) }
				{ error ? <Notice tone="error">{ error }</Notice> : null }
			</div>
		</div>
	);
}

/**
 * One file in the list: its name opens it in the media library, the decision and the image analysis
 * right here; a labelled file that is used can be checked on the site.
 * @param root0
 * @param root0.item
 * @param root0.busy
 * @param root0.onLabel
 * @param root0.onReview
 * @param root0.reviewing
 * @param root0.onVerify
 * @param root0.verifying
 */
function MediaRow( {
	item,
	busy,
	onLabel,
	onReview,
	reviewing,
	onVerify,
	verifying,
} ) {
	const labelled = item.state === 'generated' || item.state === 'modified';
	return (
		<div className={ `aal-mrow is-${ item.state || 'open' }` }>
			<span className="aal-mrow__main">
				<a
					href={ `${ boot.item }${ item.id }` }
					className="aal-mrow__thumb"
					aria-label={ __(
						'Open in the Media Library',
						'ai-act-labels'
					) }
				>
					<Thumb item={ item } />
				</a>
				<span className="aal-mrow__t">
					<b>
						<a href={ `${ boot.item }${ item.id }` }>
							{ item.title || item.file }
						</a>
						<i>{ item.file }</i>
					</b>
					<UsageLine usage={ item.usage } />
					<Traces signals={ item.signals } />
					<HintLine hint={ item.hint } />
				</span>
			</span>
			<span className="aal-mrow__right">
				<span className="aal-mrow__acts">
					<span className="aal-mrow__btns">
						{ labelled && item.usage?.length ? (
							<Button
								kind="ghost"
								size="sm"
								icon="eye"
								busy={ verifying }
								onClick={ () => onVerify( item ) }
							>
								{ __( 'Check on the site', 'ai-act-labels' ) }
							</Button>
						) : null }
						<Button
							kind="ghost"
							size="sm"
							icon="sparkle"
							busy={ reviewing }
							onClick={ () => onReview( item ) }
						>
							{ __( 'Analyze image (AI)', 'ai-act-labels' ) }
						</Button>
					</span>
					<Decide
						value={ item.state }
						suggests={ item.suggests }
						busy={ busy }
						onChange={ ( st ) => onLabel( [ item.id ], st ) }
					/>
				</span>
			</span>
		</div>
	);
}

/**
 * Prüfen: the numbers and the files by list.
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
	const [ verifying, setVerifying ] = useState( {} );
	const [ reviewing, setReviewing ] = useState( {} );
	const [ batch, setBatch ] = useState( null );
	const [ accepted, setAccepted ] = useState( null );
	const [ accepting, setAccepting ] = useState( false );
	const [ setup, setSetup ] = useState( false );
	const ready = state.assistant.ready;

	/** Every suggestion at once; the notice offers to take it back. */
	const acceptAll = () => {
		setAccepting( true );
		post( '/accept' )
			.then( ( r ) => {
				setAccepted( r.done );
				setState( ( s ) => ( { ...s, counts: r.counts } ) );
				load();
			} )
			.catch( ( e ) => setError( problem( e ).message ) )
			.finally( () => setAccepting( false ) );
	};
	const undoAccept = () => {
		const ids = ( accepted || [] ).map( ( d ) => d.id );
		setAccepted( null );
		label( ids, '', 'bulk' ).then( load );
	};

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

	/**
	 * Opens the pages the file is used on and looks for its label there.
	 * @param item
	 */
	const verify = ( item ) => {
		setVerifying( ( v ) => ( { ...v, [ item.id ]: true } ) );
		return post( '/verify', { id: item.id } )
			.then( ( r ) => replace( [ r.item ] ) )
			.catch( ( e ) => setError( problem( e ).message ) )
			.finally( () =>
				setVerifying( ( v ) => {
					const n = { ...v };
					delete n[ item.id ];
					return n;
				} )
			);
	};

	/** The image analysis looks at every file of the page without one, one after another. */
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
			<Section
				title={ __( 'Media', 'ai-act-labels' ) }
				hint={ __(
					'Decide per file: AI-generated, modified with AI or no label needed. The label is required when something looks real that did not happen that way.',
					'ai-act-labels'
				) }
				aside={
					<span className="aal-searchbox">
						<Icon name="search" size={ 15 } />
						<input
							type="search"
							value={ search }
							placeholder={ __( 'Search', 'ai-act-labels' ) }
							aria-label={ __( 'Search media', 'ai-act-labels' ) }
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
					{ list === 'suggested' && counts.suggested > 0 ? (
						<Button
							kind="primary"
							size="sm"
							icon="check"
							busy={ accepting }
							onClick={ acceptAll }
						>
							{ sprintf(
								/* translators: %d: number of suggestions */
								__(
									'Apply all %d suggestions',
									'ai-act-labels'
								),
								counts.suggested
							) }
						</Button>
					) : null }
					{ unassessed > 1 ? (
						<Button
							size="sm"
							icon="sparkle"
							busy={ !! batch }
							onClick={ () =>
								ready ? reviewAll() : setSetup( true )
							}
						>
							{ batch
								? sprintf(
										/* translators: 1: done, 2: total */
										__(
											'Analyzing … %1$d of %2$d',
											'ai-act-labels'
										),
										batch.done,
										batch.total
								  )
								: sprintf(
										/* translators: %d: number of files */
										_n(
											'Analyze %d image (AI)',
											'Analyze %d images (AI)',
											unassessed,
											'ai-act-labels'
										),
										unassessed
								  ) }
						</Button>
					) : null }
				</div>
				{ error ? <Notice tone="error">{ error }</Notice> : null }
				{ accepted ? (
					<Notice tone="success">
						{ sprintf(
							/* translators: %d: number of files */
							__( '%d suggestions applied.', 'ai-act-labels' ),
							accepted.length
						) }{ ' ' }
						<button
							type="button"
							className="aal-link-btn"
							onClick={ undoAccept }
						>
							{ __( 'Undo', 'ai-act-labels' ) }
						</button>
					</Notice>
				) : null }
				{ ! data ? (
					<Spinner label={ __( 'Loading …', 'ai-act-labels' ) } />
				) : data.items.length ? (
					<Card pad0>
						{ data.items.map( ( item ) => (
							<MediaRow
								key={ item.id }
								item={ item }
								busy={ !! busy[ item.id ] }
								onLabel={ label }
								onReview={ ( it ) =>
									ready ? review( it ) : setSetup( true )
								}
								reviewing={ !! reviewing[ item.id ] }
								onVerify={ verify }
								verifying={ !! verifying[ item.id ] }
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
								__( 'Page %1$d of %2$d', 'ai-act-labels' ),
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
						'Also in the Media Library: the “AI” filter, a column and bulk actions in the list view.',
						'ai-act-labels'
					) }{ ' ' }
					<a href={ boot.upload }>
						{ __( 'Open Media Library', 'ai-act-labels' ) }
					</a>
				</span>
			</Section>
			<Promo promo={ state.promo } />
			{ setup ? (
				<SetupDialog
					assistant={ state.assistant }
					onClose={ () => setSetup( false ) }
				/>
			) : null }
		</>
	);
}
