import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { post, problem } from './api';
import { EuIcon } from './parts';
import {
	Button,
	Card,
	Field,
	Line,
	Notice,
	Section,
	Seg,
	Switch,
	useDraft,
} from './ui';

const ICONS = [
	[ 'official', __( 'EU icon by kind', 'ai-act-labels' ), 'generated' ],
	[ 'basic', __( 'Round EU icon', 'ai-act-labels' ), 'basic' ],
	[
		'basic-text',
		__( 'Round icon, opens on hover', 'ai-act-labels' ),
		'basic',
	],
	[ 'custom', __( 'Own icon', 'ai-act-labels' ), '' ],
	[ 'sparkle', __( 'Sparkle', 'ai-act-labels' ), 'sparkle' ],
];

const COLORS = [
	[ 'black', __( 'Black', 'ai-act-labels' ) ],
	[ 'white', __( 'White', 'ai-act-labels' ) ],
	[ 'black-soft', __( 'Black 50%', 'ai-act-labels' ) ],
	[ 'white-soft', __( 'White 50%', 'ai-act-labels' ) ],
	[ 'auto', __( 'By image', 'ai-act-labels' ) ],
];

const POSITIONS = [
	[ 'top-left', __( 'Top left', 'ai-act-labels' ) ],
	[ 'top-right', __( 'Top right', 'ai-act-labels' ) ],
	[ 'bottom-left', __( 'Bottom left', 'ai-act-labels' ) ],
	[ 'bottom-right', __( 'Bottom right', 'ai-act-labels' ) ],
];

/**
 * A text with its default as placeholder; saved when the person stops typing.
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.placeholder
 * @param root0.onChange
 * @param root0.disabled
 */
function TextSetting( { label, value, placeholder, onChange, disabled } ) {
	const [ draft, setDraft ] = useDraft( value, onChange );
	return (
		<Field label={ label }>
			<input
				type="text"
				value={ draft }
				placeholder={ placeholder }
				disabled={ disabled }
				onChange={ ( e ) => setDraft( e.target.value ) }
			/>
		</Field>
	);
}

/**
 * The label on a picture, rendered by PHP with the settings as they are on the page.
 * @param root0
 * @param root0.settings
 * @param root0.sample
 */
function Preview( { settings, sample } ) {
	const [ kind, setKind ] = useState( 'generated' );
	const [ html, setHtml ] = useState( null );
	const seq = useRef( 0 );
	useEffect( () => {
		const n = ++seq.current;
		const t = window.setTimeout( () => {
			post( '/preview', { settings, id: sample?.id || 0 } )
				.then( ( r ) => n === seq.current && setHtml( r ) )
				.catch( () => undefined );
		}, 150 );
		return () => window.clearTimeout( t );
	}, [ settings, sample ] );
	return (
		<div className="aal-lpreview">
			<div className="aal-lpreview__bar">
				<b>{ __( 'How it looks on the site', 'ai-act-labels' ) }</b>
				<Seg
					value={ kind }
					label={ __( 'Kind', 'ai-act-labels' ) }
					onChange={ setKind }
					options={ [
						{
							value: 'generated',
							label: __( 'AI-generated', 'ai-act-labels' ),
						},
						{
							value: 'modified',
							label: __( 'Modified', 'ai-act-labels' ),
						},
					] }
				/>
			</div>
			{ html ? <style>{ html.css }</style> : null }
			<figure className="aal-lpreview__fig">
				<span
					className={ `ai-act-label ai-act-label--${ settings.position }` }
				>
					{ sample?.url ? (
						<img src={ sample.url } alt="" />
					) : (
						<span className="aal-lpreview__blank" />
					) }
					{ html ? (
						<span
							className="aal-lpreview__badge"
							// eslint-disable-next-line react/no-danger -- markup rendered by the plugin's PHP.
							dangerouslySetInnerHTML={ { __html: html[ kind ] } }
						/>
					) : null }
				</span>
				{ settings.caption ? (
					<figcaption>
						{ __( 'Our workshop in autumn', 'ai-act-labels' ) }
						<span className="ai-act-label__caption">
							{ ' – ' }
							{ kind === 'modified'
								? settings.texts.noticeModified ||
								  __(
										'This image was modified with AI.',
										'ai-act-labels'
								  )
								: settings.texts.noticeGenerated ||
								  __(
										'This image was created with AI.',
										'ai-act-labels'
								  ) }
						</span>
					</figcaption>
				) : null }
			</figure>
			<div className="aal-lpreview__small">
				<span className="ai-act-label">
					{ sample?.url ? (
						<img src={ sample.url } alt="" width="180" />
					) : (
						<span className="aal-lpreview__blank is-small" />
					) }
					{ html ? (
						<span
							className="aal-lpreview__badge"
							// eslint-disable-next-line react/no-danger -- markup rendered by the plugin's PHP.
							dangerouslySetInnerHTML={ { __html: html.small } }
						/>
					) : null }
				</span>
				<span className="aal-fine">
					{ __(
						'On small images (under 260 px) the plugin uses the round icon instead of the wide one.',
						'ai-act-labels'
					) }
				</span>
			</div>
			{ settings.layer ? (
				<span className="aal-fine">
					{ __(
						"Hover over the icon: the second layer shows the notice. Screen readers read it as the icon's name – the image's alt text stays as it is.",
						'ai-act-labels'
					) }
				</span>
			) : null }
		</div>
	);
}

/**
 * Darstellung: which icon, where, which words, where the label goes.
 * @param root0
 * @param root0.state
 * @param root0.setState
 */
export default function Look( { state, setState } ) {
	const s = state.settings;
	const can = state.canSettings;
	const [ error, setError ] = useState( null );
	const [ local, setLocal ] = useState( s );
	useEffect( () => setLocal( state.settings ), [ state.settings ] );

	const save = ( patch ) => {
		setLocal( ( l ) => ( {
			...l,
			...patch,
			texts: { ...l.texts, ...( patch.texts || {} ) },
			where: { ...l.where, ...( patch.where || {} ) },
		} ) );
		if ( ! can ) {
			return;
		}
		post( '/settings', { patch } )
			.then( ( next ) => setState( next ) )
			.catch( ( e ) => setError( problem( e ).message ) );
	};

	const pickIcon = () => {
		const frame = window.wp?.media( {
			title: __( 'Choose your own icon', 'ai-act-labels' ),
			library: { type: [ 'image' ] },
			multiple: false,
		} );
		if ( ! frame ) {
			return;
		}
		frame.on( 'select', () => {
			const a = frame.state().get( 'selection' ).first().toJSON();
			save( { custom: a.id, icon: 'custom' } );
		} );
		frame.open();
	};

	const d = state.defaults;
	return (
		<div className="aal-split">
			<div className="aal-split__levers">
				{ ! can ? (
					<Notice>
						{ __(
							'Administrators change the appearance. You can still label.',
							'ai-act-labels'
						) }
					</Notice>
				) : null }
				{ error ? <Notice tone="error">{ error }</Notice> : null }
				<Section
					title={ __( 'Icon', 'ai-act-labels' ) }
					hint={ __(
						"The default is the European Commission's icons – free to use, no attribution.",
						'ai-act-labels'
					) }
				>
					<div className="aal-icons">
						{ ICONS.map( ( [ value, name, icon ] ) => (
							<button
								key={ value }
								type="button"
								className={ `aal-opt${
									local.icon === value ? ' is-on' : ''
								}` }
								disabled={ ! can }
								onClick={ () =>
									value === 'custom' && ! local.custom
										? pickIcon()
										: save( { icon: value } )
								}
							>
								<span className={ `aal-opt__pv is-${ value }` }>
									{ value === 'custom' ? (
										state.custom?.url ? (
											<img
												src={ state.custom.url }
												alt=""
											/>
										) : (
											<span className="aal-opt__plus">
												+
											</span>
										)
									) : (
										<EuIcon name={ icon } />
									) }
									{ value === 'basic-text' ? (
										<EuIcon
											name="generated"
											className="aal-opt__open"
										/>
									) : null }
								</span>
								{ name }
							</button>
						) ) }
					</div>
					{ local.icon === 'custom' ? (
						<Button
							size="sm"
							onClick={ pickIcon }
							disabled={ ! can }
						>
							{ __( 'Choose another icon', 'ai-act-labels' ) }
						</Button>
					) : null }
					{ local.icon === 'sparkle' || local.icon === 'custom' ? (
						<span className="aal-fine">
							{ __(
								'Your own mark is allowed if it is as clear as the EU icon. The EU icon is the safer choice.',
								'ai-act-labels'
							) }
						</span>
					) : null }
				</Section>

				<Card className="aal-col aal-gap16">
					<Line label={ __( 'Color', 'ai-act-labels' ) }>
						<Seg
							value={ local.color }
							label={ __( 'Color', 'ai-act-labels' ) }
							onChange={ ( v ) => save( { color: v } ) }
							options={ COLORS.map( ( [ value, label ] ) => ( {
								value,
								label,
							} ) ) }
						/>
					</Line>
					<Line label={ __( 'Size', 'ai-act-labels' ) }>
						<Seg
							value={ local.size }
							label={ __( 'Size', 'ai-act-labels' ) }
							onChange={ ( v ) => save( { size: v } ) }
							options={ [
								{ value: 's', label: 'S' },
								{ value: 'm', label: 'M' },
								{ value: 'l', label: 'L' },
							] }
						/>
					</Line>
					<Line
						label={ __( 'Corner', 'ai-act-labels' ) }
						hint={ __(
							'Videos: always at the top, away from the controls.',
							'ai-act-labels'
						) }
					>
						<span
							className="aal-corners"
							role="radiogroup"
							aria-label={ __( 'Corner', 'ai-act-labels' ) }
						>
							{ POSITIONS.map( ( [ value, label ] ) => (
								<button
									key={ value }
									type="button"
									role="radio"
									aria-checked={
										local.position === value
											? 'true'
											: 'false'
									}
									aria-label={ label }
									title={ label }
									className={ `is-${ value }${
										local.position === value ? ' is-on' : ''
									}` }
									disabled={ ! can }
									onClick={ () =>
										save( { position: value } )
									}
								>
									<i />
								</button>
							) ) }
						</span>
					</Line>
				</Card>

				<Section
					title={ __( 'Words', 'ai-act-labels' ) }
					hint={ __(
						"Leave empty: the default in the site's language.",
						'ai-act-labels'
					) }
				>
					<Card className="aal-grid2">
						<TextSetting
							label={ __( 'AI-generated', 'ai-act-labels' ) }
							value={ local.texts.generated }
							placeholder={ d.generated }
							disabled={ ! can }
							onChange={ ( v ) =>
								save( { texts: { generated: v } } )
							}
						/>
						<TextSetting
							label={ __( 'Modified with AI', 'ai-act-labels' ) }
							value={ local.texts.modified }
							placeholder={ d.modified }
							disabled={ ! can }
							onChange={ ( v ) =>
								save( { texts: { modified: v } } )
							}
						/>
						<TextSetting
							label={ __(
								'Notice for AI-generated',
								'ai-act-labels'
							) }
							value={ local.texts.noticeGenerated }
							placeholder={ d.noticeGenerated }
							disabled={ ! can }
							onChange={ ( v ) =>
								save( { texts: { noticeGenerated: v } } )
							}
						/>
						<TextSetting
							label={ __(
								'Notice for modified',
								'ai-act-labels'
							) }
							value={ local.texts.noticeModified }
							placeholder={ d.noticeModified }
							disabled={ ! can }
							onChange={ ( v ) =>
								save( { texts: { noticeModified: v } } )
							}
						/>
					</Card>
				</Section>

				<Section
					title={ __( 'Where the label appears', 'ai-act-labels' ) }
				>
					<Card className="aal-col aal-gap12">
						{ [
							[
								'content',
								__(
									'Images in pages and posts',
									'ai-act-labels'
								),
								__(
									'Blocks, galleries, covers, classic editor, HTML',
									'ai-act-labels'
								),
							],
							[
								'featured',
								__(
									"Featured images and the theme's images",
									'ai-act-labels'
								),
								__(
									'everything that comes through wp_get_attachment_image()',
									'ai-act-labels'
								),
							],
							[
								'video',
								__( 'Videos', 'ai-act-labels' ),
								__(
									'Video block, cover with video, [video]',
									'ai-act-labels'
								),
							],
							[
								'audio',
								__( 'Audio', 'ai-act-labels' ),
								__(
									'a line above the player',
									'ai-act-labels'
								),
							],
						].map( ( [ key, label, hint ] ) => (
							<Line key={ key } label={ label } hint={ hint }>
								<Switch
									checked={ !! local.where[ key ] }
									label={ label }
									disabled={ ! can }
									onChange={ ( v ) =>
										save( { where: { [ key ]: v } } )
									}
								/>
							</Line>
						) ) }
						<Line
							label={ __(
								'Notice in captions',
								'ai-act-labels'
							) }
							hint={ __(
								'Only where there is one already – never in the alt text.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.caption }
								label={ __(
									'Notice in captions',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { caption: v } ) }
							/>
						</Line>
						<Line
							label={ __(
								'Second layer on hover',
								'ai-act-labels'
							) }
							hint={ __(
								'The whole notice, with the tool.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.layer }
								label={ __(
									'Second layer on hover',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { layer: v } ) }
							/>
						</Line>
					</Card>
				</Section>

				<Section title={ __( 'On upload', 'ai-act-labels' ) }>
					<Card className="aal-col aal-gap12">
						<Line
							label={ __(
								'Check files for traces of AI',
								'ai-act-labels'
							) }
							hint={ __(
								'C2PA, IPTC, generation data, file names – on your server.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.detect }
								label={ __(
									'Check files for traces of AI',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { detect: v } ) }
							/>
						</Line>
						<Line
							label={ __(
								'Apply unambiguous traces right away',
								'ai-act-labels'
							) }
							hint={ __(
								'If the file itself says it was made with AI, it is labeled right away.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.auto }
								label={ __(
									'Apply unambiguous traces right away',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { auto: v } ) }
							/>
						</Line>
						<Line
							label={ __(
								'Take over labels from the theme',
								'ai-act-labels'
							) }
							hint={ __(
								'The first version as a theme class (AiImageLabel) stored _ai_image_label.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.legacy }
								label={ __(
									'Take over labels from the theme',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { legacy: v } ) }
							/>
						</Line>
					</Card>
				</Section>
			</div>
			<div className="aal-split__preview">
				<Preview settings={ local } sample={ state.sample } />
			</div>
		</div>
	);
}
