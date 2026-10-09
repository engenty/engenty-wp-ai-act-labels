import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { post, problem } from './api';
import { Button, Engenty, Icon, Notice, Spinner } from './ui';
import { STATE_LABELS, StateChip, Thumb } from './parts';

/** How far a provider in Konnektoren is. */
const OFFER_STATES = {
	ready: __( 'eingerichtet', 'ai-act-labels' ),
	key: __( 'API Key fehlt', 'ai-act-labels' ),
	offline: __( 'antwortet nicht', 'ai-act-labels' ),
	plugin: __( 'Plugin fehlt', 'ai-act-labels' ),
};

/**
 * What the assistant needs before it answers, beside its locked input: WordPress keeps the AI provider
 * under Einstellungen › Konnektoren – the providers it lists there, how far each is, the way there.
 * Labelling, the check and the traces in files work without it.
 * @param root0
 * @param root0.assistant The assistant's status from the state.
 * @param root0.compact   One line less, for the drawer.
 */
export function Setup( { assistant, compact = false } ) {
	if ( ! assistant.wp ) {
		return (
			<div className="aal-setup">
				<b className="aal-setup__title">
					{ __(
						'Der Assistent braucht WordPress 7.0',
						'ai-act-labels'
					) }
				</b>
				<p>
					{ __(
						'Ab 7.0 denkt der Assistent mit dem KI-Anbieter, den du unter Einstellungen › Konnektoren einrichtest. Kennzeichnen, prüfen und die Spuren in Dateien funktionieren schon jetzt.',
						'ai-act-labels'
					) }
				</p>
				<div className="aal-setup__actions">
					<Button kind="primary" size="sm" href={ assistant.update }>
						{ __( 'WordPress aktualisieren', 'ai-act-labels' ) }
					</Button>
				</div>
			</div>
		);
	}
	const offers = assistant.offers || [];
	const hasVercel = offers.some( ( o ) => /vercel/i.test( o.id + o.name ) );
	return (
		<div className="aal-setup">
			<b className="aal-setup__title">
				<Icon name="lock" size={ 13 } />{ ' ' }
				{ __( 'Erst einen KI-Anbieter einrichten', 'ai-act-labels' ) }
			</b>
			{ compact ? null : (
				<p>
					{ __(
						'Der Assistent denkt mit dem Anbieter, den du in WordPress unter Einstellungen › Konnektoren einrichtest – dein API Key bleibt dort. Kennzeichnen, prüfen und die Spuren in Dateien funktionieren auch ohne.',
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
					{ __( 'Konnektoren öffnen', 'ai-act-labels' ) }
				</Button>
				{ hasVercel ? null : (
					<Button kind="ghost" size="sm" href={ assistant.vercel }>
						{ __(
							'Vercel AI Gateway installieren',
							'ai-act-labels'
						) }
					</Button>
				) }
			</div>
			{ hasVercel || compact ? null : (
				<span className="aal-fine">
					{ __(
						'Ohne Vertrag bei einem Anbieter: Vercel AI Gateway gibt 5 $ im Monat gratis, keine Kreditkarte.',
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
						? __(
								'Wartet auf einen KI-Anbieter …',
								'ai-act-labels'
						  )
						: placeholder
				}
				aria-label={ __( 'Frage an den Assistenten', 'ai-act-labels' ) }
				disabled={ locked || busy }
			/>
			<button
				type="submit"
				className="aal-go"
				disabled={ locked || busy || ! text.trim() }
				aria-label={ __( 'Senden', 'ai-act-labels' ) }
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
					{ __( 'übernommen', 'ai-act-labels' ) }
				</span>
			) : (
				<Button size="sm" onClick={ onApply }>
					{ __( 'Übernehmen', 'ai-act-labels' ) }
				</Button>
			) }
		</div>
	);
}

/**
 * The assistant on Prüfen: a question, the answer below, the labels it suggests.
 * @param root0
 * @param root0.state   The tool's state.
 * @param root0.onLabel Applies a label: (ids, state, via) => Promise.
 * @param root0.onOpen  Opens a file's details.
 */
export function AssistantCard( { state, onLabel, onOpen } ) {
	const assistant = state.assistant;
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
		__( 'Welche Bilder muss ich kennzeichnen?', 'ai-act-labels' ),
		__(
			'Ist ein KI-Porträt im Team-Bereich ein Deepfake?',
			'ai-act-labels'
		),
		__( 'Reicht ein Hinweis im Impressum?', 'ai-act-labels' ),
	];

	return (
		<div className={ `aal-acard${ locked ? ' is-off' : '' }` }>
			<span className="aal-acard__eng">
				<Engenty kind="drop" size={ 52 } dim={ locked } />
			</span>
			<span className={ `aal-kick${ locked ? ' is-off' : '' }` }>
				<Icon name="sparkle" size={ 12 } />{ ' ' }
				{ __( 'Assistent', 'ai-act-labels' ) }
			</span>
			<h2>{ __( 'Was muss ich kennzeichnen?', 'ai-act-labels' ) }</h2>
			<p>
				{ __(
					'Der Assistent kennt den AI Act, die Spuren in deinen Dateien und wo sie verwendet werden. Er schlägt vor – du entscheidest.',
					'ai-act-labels'
				) }
			</p>
			<ChatInput
				placeholder={ __(
					'z. B. „Welche Bilder auf der Startseite brauchen einen Hinweis?“',
					'ai-act-labels'
				) }
				locked={ locked }
				busy={ busy }
				onSend={ send }
			/>
			{ locked ? <Setup assistant={ assistant } /> : null }
			{ ! locked && ! turns.length ? (
				<div className="aal-sugg">
					{ suggestions.map( ( s ) => (
						<button
							key={ s }
							type="button"
							onClick={ () => send( s ) }
							disabled={ busy }
						>
							„{ s }“
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
															'Alle %d übernehmen',
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
						<Spinner label={ __( 'denkt …', 'ai-act-labels' ) } />
					) : null }
					{ error ? <Notice tone="error">{ error }</Notice> : null }
					<span ref={ end } />
				</div>
			) : null }
			{ ! locked && assistant.last ? (
				<span className="aal-fine aal-acard__who">
					{ sprintf(
						/* translators: %s: provider and model */
						__( 'Denkt mit %s', 'ai-act-labels' ),
						assistant.last
					) }
				</span>
			) : null }
		</div>
	);
}

export { STATE_LABELS };
