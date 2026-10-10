import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { post, problem } from './api';
import { Button, Engenty, Icon, Notice, Spinner } from './ui';
import { STATE_LABELS, StateChip, Thumb } from './parts';

/** How far a provider in Konnektoren is. */
const OFFER_STATES = {
	ready: __( 'set up', 'ai-act-labels' ),
	key: __( 'API key missing', 'ai-act-labels' ),
	offline: __( 'not responding', 'ai-act-labels' ),
	plugin: __( 'plugin missing', 'ai-act-labels' ),
};

/**
 * What the assistant needs before it answers, beside its locked input: WordPress keeps the AI provider
 * under Einstellungen › Konnektoren – the providers it lists there, how far each is, the way there.
 * Labelling, the check and the traces in files work without it.
 * @param root0
 * @param root0.assistant The assistant's status from the state.
 * @param root0.compact   One line less, for the drawer.
 * @param root0.onHide
 */
export function Setup( { assistant, compact = false, onHide } ) {
	if ( ! assistant.wp ) {
		return (
			<div className="aal-setup">
				<b className="aal-setup__title">
					{ __(
						'The assistant needs WordPress 7.0',
						'ai-act-labels'
					) }
				</b>
				<p>
					{ __(
						'From 7.0, the assistant thinks with the AI provider you set up under Settings › Connectors. Labeling, the check and the traces in files already work.',
						'ai-act-labels'
					) }
				</p>
				<div className="aal-setup__actions">
					<Button kind="primary" size="sm" href={ assistant.update }>
						{ __( 'Update WordPress', 'ai-act-labels' ) }
					</Button>
				</div>
			</div>
		);
	}
	const offers = assistant.offers || [];
	const hasVercel = offers.some( ( o ) => /vercel/i.test( o.id + o.name ) );
	return (
		<div className="aal-setup">
			{ onHide ? (
				<button
					type="button"
					className="aal-icon-btn aal-setup__hide"
					onClick={ onHide }
					aria-label={ __( 'Hide notice', 'ai-act-labels' ) }
					title={ __( 'Hide notice', 'ai-act-labels' ) }
				>
					<Icon name="x" size={ 16 } />
				</button>
			) : null }
			<b className="aal-setup__title">
				<Icon name="lock" size={ 13 } />{ ' ' }
				{ __( 'Set up an AI provider first', 'ai-act-labels' ) }
			</b>
			{ compact ? null : (
				<p>
					{ __(
						'The assistant thinks with the provider you set up in WordPress under Settings › Connectors – your API key stays there. Labeling, the check and the traces in files work without it.',
						'ai-act-labels'
					) }
				</p>
			) }
			{ offers.length ? (
				<div className="aal-offers">
					{ offers.map( ( o ) => (
						<a
							key={ o.id }
							className={ `aal-offer is-${ o.state }` }
							href={ assistant.connectors }
						>
							<span
								className="aal-offer__logo"
								aria-hidden="true"
							>
								{ o.logo ? (
									<img src={ o.logo } alt="" />
								) : (
									o.name.slice( 0, 1 )
								) }
							</span>
							{ o.name }
							<span className="aal-offer__state">
								{ OFFER_STATES[ o.state ] || '' }
							</span>
						</a>
					) ) }
				</div>
			) : null }
			<div className="aal-setup__actions">
				<Button kind="primary" size="sm" href={ assistant.connectors }>
					{ __( 'Open Connectors', 'ai-act-labels' ) }
				</Button>
				{ hasVercel ? null : (
					<Button kind="ghost" size="sm" href={ assistant.vercel }>
						{ __( 'Install Vercel AI Gateway', 'ai-act-labels' ) }
					</Button>
				) }
			</div>
			{ hasVercel || compact ? null : (
				<span className="aal-fine">
					{ __(
						'No contract with a provider? Vercel AI Gateway gives $5 a month free, no credit card.',
						'ai-act-labels'
					) }
				</span>
			) }
		</div>
	);
}

/**
 * The line to type into; locked until WordPress has an AI provider.
 * @param root0
 * @param root0.placeholder
 * @param root0.locked
 * @param root0.busy
 * @param root0.onSend
 */
function ChatInput( { placeholder, locked, busy, onSend } ) {
	const [ text, setText ] = useState( '' );
	const submit = ( e ) => {
		e.preventDefault();
		const t = text.trim();
		if ( ! t || locked || busy ) {
			return;
		}
		setText( '' );
		onSend( t );
	};
	return (
		<form
			className={ `aal-composer aal-composer--card${
				locked ? ' is-locked' : ''
			}` }
			onSubmit={ submit }
		>
			<input
				type="text"
				value={ text }
				onChange={ ( e ) => setText( e.target.value ) }
				placeholder={
					locked
						? __( 'Waiting for an AI provider …', 'ai-act-labels' )
						: placeholder
				}
				aria-label={ __(
					'Question for the assistant',
					'ai-act-labels'
				) }
				disabled={ locked || busy }
			/>
			<button
				type="submit"
				className="aal-go"
				disabled={ locked || busy || ! text.trim() }
				aria-label={ __( 'Send', 'ai-act-labels' ) }
			>
				<Icon name={ locked ? 'lock' : 'send' } size={ 16 } />
			</button>
		</form>
	);
}

/**
 * A label the assistant suggests, with the button that applies it.
 * @param root0
 * @param root0.s       The suggestion: id, state, reason, media.
 * @param root0.applied Whether it was applied.
 * @param root0.onApply Applies it.
 * @param root0.onOpen  Opens the file's details.
 */
function SuggestionCard( { s, applied, onApply, onOpen } ) {
	return (
		<div className="aal-sugcard">
			<Thumb item={ s.media } size={ 44 } />
			<button
				type="button"
				className="aal-sugcard__t"
				onClick={ () => onOpen( s.media ) }
			>
				<b>{ s.media.title || s.media.file }</b>
				<span>{ s.reason }</span>
			</button>
			<StateChip state={ s.state } />
			{ applied ? (
				<span className="aal-chip aal-chip--moss">
					<Icon name="check" size={ 11 } />{ ' ' }
					{ __( 'applied', 'ai-act-labels' ) }
				</span>
			) : (
				<Button size="sm" onClick={ onApply }>
					{ __( 'Apply', 'ai-act-labels' ) }
				</Button>
			) }
		</div>
	);
}

/**
 * The assistant on Prüfen: a question, the answer below, the labels it suggests.
 * @param root0
 * @param root0.state    The tool's state.
 * @param root0.onLabel  Applies a label: (ids, state, via) => Promise.
 * @param root0.onOpen   Opens a file's details.
 * @param root0.setState
 */
export function AssistantCard( { state, setState, onLabel, onOpen } ) {
	const assistant = state.assistant;
	const hidden = ( state.hidden || [] ).includes( 'setup' );
	const toggleSetup = ( hide ) => {
		setState( ( s ) => ( {
			...s,
			hidden: hide
				? [ ...( s.hidden || [] ), 'setup' ]
				: ( s.hidden || [] ).filter( ( k ) => k !== 'setup' ),
		} ) );
		post( '/hide', { key: 'setup', hidden: hide } ).catch(
			() => undefined
		);
	};
	const locked = ! assistant.ready;
	const [ turns, setTurns ] = useState( [] );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ applied, setApplied ] = useState( {} );
	const end = useRef();

	useEffect( () => {
		if ( turns.length ) {
			end.current?.scrollIntoView( {
				block: 'nearest',
				behavior: 'smooth',
			} );
		}
	}, [ turns.length, busy ] );

	const send = ( text ) => {
		const history = turns.map( ( t ) => ( {
			role: t.role,
			text: t.text,
		} ) );
		setTurns( ( t ) => [ ...t, { role: 'me', text } ] );
		setBusy( true );
		setError( null );
		post( '/assist', { message: text, history } )
			.then( ( answer ) =>
				setTurns( ( t ) => [
					...t,
					{
						role: 'assistant',
						text: answer.message,
						suggestions: answer.suggestions || [],
					},
				] )
			)
			.catch( ( e ) => setError( problem( e ).message ) )
			.finally( () => setBusy( false ) );
	};

	const apply = ( list ) => {
		const byState = {};
		list.forEach( ( s ) => {
			byState[ s.state ] = [ ...( byState[ s.state ] || [] ), s.id ];
		} );
		return Promise.all(
			Object.entries( byState ).map( ( [ st, ids ] ) =>
				onLabel( ids, st, 'assistant' )
			)
		).then( () =>
			setApplied( ( a ) => {
				const next = { ...a };
				list.forEach( ( s ) => ( next[ s.id ] = s.state ) );
				return next;
			} )
		);
	};

	const suggestions = [
		__( 'Which images do I have to label?', 'ai-act-labels' ),
		__( 'Is an AI portrait on the team page a deepfake?', 'ai-act-labels' ),
		__( 'Is a note in the imprint enough?', 'ai-act-labels' ),
	];

	return (
		<div className={ `aal-acard${ locked ? ' is-off' : '' }` }>
			<span className="aal-acard__eng">
				<Engenty kind="drop" size={ 52 } dim={ locked } />
			</span>
			<span className={ `aal-kick${ locked ? ' is-off' : '' }` }>
				<Icon name="sparkle" size={ 12 } />{ ' ' }
				{ __( 'Assistant', 'ai-act-labels' ) }
			</span>
			<h2>{ __( 'What do I have to label?', 'ai-act-labels' ) }</h2>
			<p>
				{ __(
					'The assistant knows the AI Act, the traces in your files and where they are used. It suggests – you decide.',
					'ai-act-labels'
				) }
			</p>
			<ChatInput
				placeholder={ __(
					'e.g. “Which images on the home page need a label?”',
					'ai-act-labels'
				) }
				locked={ locked }
				busy={ busy }
				onSend={ send }
			/>
			{ locked && ! hidden ? (
				<Setup
					assistant={ assistant }
					onHide={ () => toggleSetup( true ) }
				/>
			) : null }
			{ locked && hidden ? (
				<span className="aal-fine aal-setup-hidden">
					{ __(
						'The assistant needs an AI provider.',
						'ai-act-labels'
					) }{ ' ' }
					<button
						type="button"
						className="aal-link-btn"
						onClick={ () => toggleSetup( false ) }
					>
						{ __( 'How?', 'ai-act-labels' ) }
					</button>
				</span>
			) : null }
			{ ! locked && ! turns.length ? (
				<div className="aal-sugg">
					{ suggestions.map( ( s ) => (
						<button
							key={ s }
							type="button"
							onClick={ () => send( s ) }
							disabled={ busy }
						>
							“{ s }”
						</button>
					) ) }
				</div>
			) : null }
			{ turns.length ? (
				<div className="aal-thread">
					{ turns.map( ( t, i ) => (
						<div
							key={ i }
							className={ `aal-msg${
								t.role === 'me' ? ' aal-msg--me' : ''
							}` }
						>
							<div className="aal-msg__b">
								{ t.text }
								{ t.suggestions?.length ? (
									<div className="aal-sugcards">
										{ t.suggestions.map( ( s ) => (
											<SuggestionCard
												key={ s.id }
												s={ s }
												applied={
													applied[ s.id ] === s.state
												}
												onApply={ () => apply( [ s ] ) }
												onOpen={ onOpen }
											/>
										) ) }
										{ t.suggestions.length > 1 &&
										t.suggestions.some(
											( s ) => applied[ s.id ] !== s.state
										) ? (
											<div className="aal-sugcards__all">
												<Button
													kind="primary"
													size="sm"
													onClick={ () =>
														apply( t.suggestions )
													}
												>
													{ sprintf(
														/* translators: %d: number of suggestions */
														__(
															'Apply all %d',
															'ai-act-labels'
														),
														t.suggestions.length
													) }
												</Button>
											</div>
										) : null }
									</div>
								) : null }
							</div>
						</div>
					) ) }
					{ busy ? (
						<Spinner
							label={ __( 'thinking …', 'ai-act-labels' ) }
						/>
					) : null }
					{ error ? <Notice tone="error">{ error }</Notice> : null }
					<span ref={ end } />
				</div>
			) : null }
			{ ! locked && assistant.last ? (
				<span className="aal-fine aal-acard__who">
					{ sprintf(
						/* translators: %s: provider and model */
						__( 'Thinks with %s', 'ai-act-labels' ),
						assistant.last
					) }
				</span>
			) : null }
		</div>
	);
}

export { STATE_LABELS };
