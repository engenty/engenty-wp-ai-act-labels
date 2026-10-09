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
	[ 'official', __( 'EU-Icon je nach Art', 'ai-act-labels' ), 'generated' ],
	[ 'basic', __( 'Rundes EU-Icon', 'ai-act-labels' ), 'basic' ],
	[ 'basic-text', __( 'Rundes Icon mit Text', 'ai-act-labels' ), 'basic' ],
	[ 'custom', __( 'Eigenes Icon', 'ai-act-labels' ), '' ],
	[ 'sparkle', __( 'Funkeln', 'ai-act-labels' ), 'sparkle' ],
];

const COLORS = [
	[ 'black', __( 'Schwarz', 'ai-act-labels' ) ],
	[ 'white', __( 'Weiß', 'ai-act-labels' ) ],
	[ 'black-soft', __( 'Schwarz 50 %', 'ai-act-labels' ) ],
	[ 'white-soft', __( 'Weiß 50 %', 'ai-act-labels' ) ],
	[ 'auto', __( 'Nach Bild', 'ai-act-labels' ) ],
];

const POSITIONS = [
	[ 'top-left', __( 'Oben links', 'ai-act-labels' ) ],
	[ 'top-right', __( 'Oben rechts', 'ai-act-labels' ) ],
	[ 'bottom-left', __( 'Unten links', 'ai-act-labels' ) ],
	[ 'bottom-right', __( 'Unten rechts', 'ai-act-labels' ) ],
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
				<b>
					{ __( 'So sieht es auf der Website aus', 'ai-act-labels' ) }
				</b>
				<Seg
					value={ kind }
					label={ __( 'Art', 'ai-act-labels' ) }
					onChange={ setKind }
					options={ [
						{
							value: 'generated',
							label: __( 'KI-generiert', 'ai-act-labels' ),
						},
						{
							value: 'modified',
							label: __( 'Verändert', 'ai-act-labels' ),
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
						{ __( 'Unsere Werkstatt im Herbst', 'ai-act-labels' ) }
						<span className="ai-act-label__caption">
							{ ' – ' }
							{ kind === 'modified'
								? settings.texts.noticeModified ||
								  __(
										'Dieses Bild wurde mit KI verändert.',
										'ai-act-labels'
								  )
								: settings.texts.noticeGenerated ||
								  __(
										'Dieses Bild wurde mit KI erzeugt.',
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
						'Auf kleinen Bildern (unter 260 px) nimmt das Plugin das runde Icon statt des breiten.',
						'ai-act-labels'
					) }
				</span>
			</div>
			{ settings.layer ? (
				<span className="aal-fine">
					{ __(
						'Fahr mit der Maus übers Icon: die zweite Ebene zeigt den Hinweis. Screenreader lesen ihn als Namen des Icons – der Alt-Text des Bildes bleibt, wie er ist.',
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
			title: __( 'Eigenes Icon wählen', 'ai-act-labels' ),
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
							'Die Darstellung ändern Administratoren. Kennzeichnen kannst du trotzdem.',
							'ai-act-labels'
						) }
					</Notice>
				) : null }
				{ error ? <Notice tone="error">{ error }</Notice> : null }
				<Section
					title={ __( 'Icon', 'ai-act-labels' ) }
					hint={ __(
						'Standard sind die Icons der EU-Kommission – frei verwendbar, ohne Namensnennung.',
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
										<span className="aal-opt__txt">
											{ local.texts.generated ||
												d.generated }
										</span>
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
							{ __( 'Anderes Icon wählen', 'ai-act-labels' ) }
						</Button>
					) : null }
					{ local.icon === 'sparkle' || local.icon === 'custom' ? (
						<span className="aal-fine">
							{ __(
								'Ein eigenes Zeichen ist erlaubt, wenn es so deutlich ist wie das EU-Icon. Sicherer bleibt das EU-Icon.',
								'ai-act-labels'
							) }
						</span>
					) : null }
				</Section>

				<Card className="aal-col aal-gap16">
					<Line label={ __( 'Farbe', 'ai-act-labels' ) }>
						<Seg
							value={ local.color }
							label={ __( 'Farbe', 'ai-act-labels' ) }
							onChange={ ( v ) => save( { color: v } ) }
							options={ COLORS.map( ( [ value, label ] ) => ( {
								value,
								label,
							} ) ) }
						/>
					</Line>
					<Line label={ __( 'Größe', 'ai-act-labels' ) }>
						<Seg
							value={ local.size }
							label={ __( 'Größe', 'ai-act-labels' ) }
							onChange={ ( v ) => save( { size: v } ) }
							options={ [
								{ value: 's', label: 'S' },
								{ value: 'm', label: 'M' },
								{ value: 'l', label: 'L' },
							] }
						/>
					</Line>
					<Line
						label={ __( 'Ecke', 'ai-act-labels' ) }
						hint={ __(
							'Videos: immer oben, wo die Steuerung nicht ist.',
							'ai-act-labels'
						) }
					>
						<span
							className="aal-corners"
							role="radiogroup"
							aria-label={ __( 'Ecke', 'ai-act-labels' ) }
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
					title={ __( 'Worte', 'ai-act-labels' ) }
					hint={ __(
						'Leer lassen: der Standard in der Sprache der Website.',
						'ai-act-labels'
					) }
				>
					<Card className="aal-grid2">
						<TextSetting
							label={ __( 'KI-generiert', 'ai-act-labels' ) }
							value={ local.texts.generated }
							placeholder={ d.generated }
							disabled={ ! can }
							onChange={ ( v ) =>
								save( { texts: { generated: v } } )
							}
						/>
						<TextSetting
							label={ __( 'Mit KI verändert', 'ai-act-labels' ) }
							value={ local.texts.modified }
							placeholder={ d.modified }
							disabled={ ! can }
							onChange={ ( v ) =>
								save( { texts: { modified: v } } )
							}
						/>
						<TextSetting
							label={ __(
								'Hinweis bei KI-generiert',
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
								'Hinweis bei verändert',
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
					title={ __( 'Wo der Hinweis erscheint', 'ai-act-labels' ) }
				>
					<Card className="aal-col aal-gap12">
						{ [
							[
								'content',
								__(
									'Bilder in Seiten und Beiträgen',
									'ai-act-labels'
								),
								__(
									'Blöcke, Galerien, Cover, klassischer Editor, HTML',
									'ai-act-labels'
								),
							],
							[
								'featured',
								__(
									'Beitragsbilder und Bilder des Themes',
									'ai-act-labels'
								),
								__(
									'alles, was über wp_get_attachment_image() kommt',
									'ai-act-labels'
								),
							],
							[
								'video',
								__( 'Videos', 'ai-act-labels' ),
								__(
									'Video-Block, Cover mit Video, [video]',
									'ai-act-labels'
								),
							],
							[
								'audio',
								__( 'Audio', 'ai-act-labels' ),
								__(
									'eine Zeile über dem Player',
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
								'Hinweis an Bildunterschriften',
								'ai-act-labels'
							) }
							hint={ __(
								'Nur wo schon eine steht – nie im Alt-Text.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.caption }
								label={ __(
									'Hinweis an Bildunterschriften',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { caption: v } ) }
							/>
						</Line>
						<Line
							label={ __(
								'Zweite Ebene beim Überfahren',
								'ai-act-labels'
							) }
							hint={ __(
								'Der ganze Hinweis, mit Werkzeug.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.layer }
								label={ __(
									'Zweite Ebene beim Überfahren',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { layer: v } ) }
							/>
						</Line>
					</Card>
				</Section>

				<Section title={ __( 'Beim Hochladen', 'ai-act-labels' ) }>
					<Card className="aal-col aal-gap12">
						<Line
							label={ __(
								'Dateien auf Spuren von KI prüfen',
								'ai-act-labels'
							) }
							hint={ __(
								'C2PA, IPTC, Generierungsdaten, Dateinamen – auf deinem Server.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.detect }
								label={ __(
									'Dateien auf Spuren von KI prüfen',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { detect: v } ) }
							/>
						</Line>
						<Line
							label={ __(
								'Eindeutige Spuren gleich übernehmen',
								'ai-act-labels'
							) }
							hint={ __(
								'Sagt die Datei selbst, dass sie mit KI gemacht ist, wird sie gleich gekennzeichnet.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.auto }
								label={ __(
									'Eindeutige Spuren gleich übernehmen',
									'ai-act-labels'
								) }
								disabled={ ! can }
								onChange={ ( v ) => save( { auto: v } ) }
							/>
						</Line>
						<Line
							label={ __(
								'Kennzeichnungen aus dem Theme übernehmen',
								'ai-act-labels'
							) }
							hint={ __(
								'Die erste Version als Theme-Klasse (AiImageLabel) speicherte _ai_image_label.',
								'ai-act-labels'
							) }
						>
							<Switch
								checked={ local.legacy }
								label={ __(
									'Kennzeichnungen aus dem Theme übernehmen',
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
