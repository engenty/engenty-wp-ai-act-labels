import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Icon } from './ui';

/** How far a provider in Konnektoren is. */
const OFFER_STATES = {
	ready: __( 'set up', 'ai-act-labels' ),
	key: __( 'API key missing', 'ai-act-labels' ),
	offline: __( 'not responding', 'ai-act-labels' ),
	plugin: __( 'plugin missing', 'ai-act-labels' ),
};

/**
 * What an assessment needs: WordPress keeps the AI provider under Einstellungen › Konnektoren – the providers
 * it lists there, how far each is, the way there. Labelling, the check and the traces in files work without it.
 * @param root0
 * @param root0.assistant The assistant's status from the state.
 */
function Setup( { assistant } ) {
	if ( ! assistant.wp ) {
		return (
			<div className="aal-setup">
				<b className="aal-setup__title">
					{ __( 'Assessing needs WordPress 7.0', 'ai-act-labels' ) }
				</b>
				<p>
					{ __(
						'From 7.0, the assessment thinks with the AI provider you set up under Settings › Connectors. Labeling, the check and the traces in files already work.',
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
			<b className="aal-setup__title">
				<Icon name="lock" size={ 13 } />{ ' ' }
				{ __( 'Set up an AI provider first', 'ai-act-labels' ) }
			</b>
			<p>
				{ __(
					'The assessment thinks with the provider you set up in WordPress under Settings › Connectors – your API key stays there. Labeling, the check and the traces in files work without it.',
					'ai-act-labels'
				) }
			</p>
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
			{ hasVercel ? null : (
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
 * The setup as a dialog: opens when someone asks for an assessment and no AI provider is set up.
 * @param root0
 * @param root0.assistant
 * @param root0.onClose
 */
export function SetupDialog( { assistant, onClose } ) {
	useEffect( () => {
		const esc = ( e ) => e.key === 'Escape' && onClose();
		window.addEventListener( 'keydown', esc );
		return () => window.removeEventListener( 'keydown', esc );
	}, [ onClose ] );
	return (
		<div
			className="aal-modal"
			role="presentation"
			onClick={ ( e ) => e.target === e.currentTarget && onClose() }
		>
			<div
				className="aal-modal__box"
				role="dialog"
				aria-modal="true"
				aria-label={ __(
					'Set up an AI provider first',
					'ai-act-labels'
				) }
			>
				<button
					type="button"
					className="aal-icon-btn aal-modal__close"
					onClick={ onClose }
					aria-label={ __( 'Close', 'ai-act-labels' ) }
				>
					<Icon name="x" size={ 16 } />
				</button>
				<Setup assistant={ assistant } />
			</div>
		</div>
	);
}
