import { __ } from '@wordpress/i18n';
import { boot } from './api';
import { EuIcon, Promo } from './parts';
import { Button, Card, Icon, Section } from './ui';

/** Typical files on a business website and what they need. */
const CASES = [
	[
		__(
			'Fotorealistisches KI-„Teamfoto“, Kundenporträt, Testimonial',
			'ai-act-labels'
		),
		'generated',
		'required',
	],
	[
		__(
			'Echtes Foto, Hintergrund oder Person mit KI ersetzt oder ergänzt',
			'ai-act-labels'
		),
		'modified',
		'required',
	],
	[
		__(
			'KI-Produktfoto, das wie ein echtes Foto des Produkts wirkt',
			'ai-act-labels'
		),
		'generated',
		'required',
	],
	[
		__(
			'KI-Bild eines echten Gebäudes, Ortes oder Ereignisses',
			'ai-act-labels'
		),
		'generated',
		'required',
	],
	[
		__(
			'Erkennbare Illustration, Comic, 3D-Grafik, abstrakter Hintergrund',
			'ai-act-labels'
		),
		'generated',
		'voluntary',
	],
	[
		__(
			'Echtes Foto, nur Farbe, Licht, Rauschen oder Ausschnitt mit KI-Werkzeug',
			'ai-act-labels'
		),
		'none',
		'none',
	],
	[ __( 'Kamera- oder Stockfoto ohne KI', 'ai-act-labels' ), 'none', 'none' ],
];

const DUTY = {
	required: [ 'rose', __( 'Pflicht', 'ai-act-labels' ) ],
	voluntary: [ 'amber', __( 'freiwillig', 'ai-act-labels' ) ],
	none: [ 'moss', __( 'kein Hinweis', 'ai-act-labels' ) ],
};

const SOURCES = [
	[
		__(
			'Fragen und Antworten zu Artikel 50 (EU-Kommission)',
			'ai-act-labels'
		),
		'https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act',
	],
	[
		__(
			'Verhaltenskodex zur Kennzeichnung KI-generierter Inhalte',
			'ai-act-labels'
		),
		'https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content',
	],
	[
		__( 'Die EU-Icons zum Herunterladen', 'ai-act-labels' ),
		'https://digital-strategy.ec.europa.eu/en/policies/eu-icons-labelling-ai-generated-content',
	],
	[
		__(
			'AI Act im Amtsblatt (Verordnung (EU) 2024/1689)',
			'ai-act-labels'
		),
		'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
	],
	[
		__( 'AI Act Service Desk', 'ai-act-labels' ),
		'https://ai-act-service-desk.ec.europa.eu/',
	],
];

/**
 * Wissen: what Article 50 asks of a website, in plain words – the same knowledge the assistant has.
 * @param root0
 * @param root0.state
 * @param root0.onAsk Goes to the assistant.
 */
export default function Knowledge( { state, onAsk } ) {
	return (
		<>
			<div className="aal-khero">
				<div>
					<span className="aal-kick">
						{ __( 'AI Act, Artikel 50', 'ai-act-labels' ) }
					</span>
					<h1>
						{ __(
							'Seit 2. August 2026 muss sichtbar sein, was KI gemacht hat.',
							'ai-act-labels'
						) }
					</h1>
					<p>
						{ __(
							'Wer als Unternehmen Bilder, Videos oder Tonaufnahmen veröffentlicht, die echt wirken, aber mit KI erzeugt oder verändert sind, muss das kennzeichnen – sichtbar, spätestens beim ersten Blick darauf. Die Pflicht trifft dich als Betreiber der Website, nicht den Hersteller des KI-Werkzeugs.',
							'ai-act-labels'
						) }
					</p>
				</div>
				<div className="aal-khero__icons">
					<EuIcon name="generated" />
					<EuIcon name="modified" />
					<EuIcon name="basic" />
				</div>
			</div>

			<div className="aal-kgrid">
				<Card className="aal-kcard">
					<span className="aal-kcard__ic is-rose">
						<Icon name="warn" size={ 16 } />
					</span>
					<h2>{ __( 'Kennzeichnen musst du', 'ai-act-labels' ) }</h2>
					<ul>
						<li>
							{ __(
								'Deepfakes: Bilder, Videos, Audio mit KI, die echte oder plausible Personen, Dinge, Orte oder Ereignisse zeigen und echt wirken – auch eine erfundene, aber fotorealistische Person.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'KI-Texte, die die Öffentlichkeit über Themen von öffentlichem Interesse informieren – außer ein Mensch hat sie geprüft und verantwortet sie.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'Ob du täuschen wolltest, ist egal. Es zählt, was dein Publikum glaubt.',
								'ai-act-labels'
							) }
						</li>
					</ul>
				</Card>
				<Card className="aal-kcard">
					<span className="aal-kcard__ic is-moss">
						<Icon name="check" size={ 16 } />
					</span>
					<h2>
						{ __( 'Keinen Hinweis brauchen', 'ai-act-labels' ) }
					</h2>
					<ul>
						<li>
							{ __(
								'Normale Bearbeitung: Ausschnitt, Licht, Farbe, Rauschen, Staub, Hochskalieren – auch mit KI-Werkzeugen.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'Offensichtlich künstliche Bilder (Illustration, Comic, Abstraktes): freiwillig, aber für das Vertrauen gut.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'Inhalte, die vor dem 2. August 2026 erzeugt wurden – rückwirkend gilt nichts.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'Kunst, Satire, Fiktion: ja, aber so, dass das Werk nicht leidet (z. B. in der Bildunterschrift).',
								'ai-act-labels'
							) }
						</li>
					</ul>
				</Card>
				<Card className="aal-kcard">
					<span className="aal-kcard__ic">
						<Icon name="eye" size={ 16 } />
					</span>
					<h2>
						{ __( 'So gehört der Hinweis hin', 'ai-act-labels' ) }
					</h2>
					<ul>
						<li>
							{ __(
								'Auf oder direkt am Inhalt, ohne Klick erkennbar – nicht nur im Impressum.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'Klare Worte: „KI-generiert“, „Mit KI verändert“. Für Screenreader als Name des Icons, nie statt des Alt-Texts.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'Videos: die ganze Zeit in einer Ecke. Audio: beim Player und im Cover.',
								'ai-act-labels'
							) }
						</li>
						<li>
							{ __(
								'Wasserzeichen oder Metadaten des KI-Werkzeugs zählen für dich nicht.',
								'ai-act-labels'
							) }
						</li>
					</ul>
				</Card>
			</div>

			<Section
				title={ __( 'Die Icons der EU', 'ai-act-labels' ) }
				hint={ __(
					'Seit Juni 2026 von der Kommission, frei verwendbar, ohne Namensnennung. Freiwillig – ein gleichwertiger Hinweis ist auch erlaubt.',
					'ai-act-labels'
				) }
			>
				<Card className="aal-kicons">
					<div>
						<EuIcon name="generated" />
						<b>{ __( 'AI GENERATED', 'ai-act-labels' ) }</b>
						<p>
							{ __(
								'Ganz mit KI erzeugt, ohne menschlich gemachte Teile.',
								'ai-act-labels'
							) }
						</p>
					</div>
					<div>
						<EuIcon name="modified" />
						<b>{ __( 'AI MODIFIED', 'ai-act-labels' ) }</b>
						<p>
							{ __(
								'Echtes Foto, Video oder echte Aufnahme, teilweise mit KI verändert.',
								'ai-act-labels'
							) }
						</p>
					</div>
					<div>
						<EuIcon name="basic" />
						<b>{ __( 'AI', 'ai-act-labels' ) }</b>
						<p>
							{ __(
								'Das Basis-Icon: mit eigenem Text, mit zweiter Ebene oder wo wenig Platz ist.',
								'ai-act-labels'
							) }
						</p>
					</div>
				</Card>
			</Section>

			<Section title={ __( 'Typische Fälle', 'ai-act-labels' ) }>
				<table className="aal-table">
					<thead>
						<tr>
							<th>{ __( 'Datei', 'ai-act-labels' ) }</th>
							<th>{ __( 'Art', 'ai-act-labels' ) }</th>
							<th>{ __( 'Hinweis', 'ai-act-labels' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ CASES.map( ( [ text, kind, duty ] ) => (
							<tr key={ text }>
								<td>{ text }</td>
								<td>
									{ kind === 'none'
										? '–'
										: kind === 'modified'
										? __(
												'Mit KI verändert',
												'ai-act-labels'
										  )
										: __(
												'KI-generiert',
												'ai-act-labels'
										  ) }
								</td>
								<td>
									<span
										className={ `aal-chip aal-chip--${ DUTY[ duty ][ 0 ] }` }
									>
										{ DUTY[ duty ][ 1 ] }
									</span>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</Section>

			<div className="aal-kgrid aal-kgrid--2">
				<Section
					title={ __(
						'Woran das Plugin KI erkennt',
						'ai-act-labels'
					) }
				>
					<Card className="aal-prose">
						<p>
							{ __(
								'Viele KI-Werkzeuge schreiben in die Datei, dass sie mit KI gemacht ist: Content Credentials (C2PA) von ChatGPT, Gemini, Firefly oder Photoshop, die IPTC-Angabe „trainedAlgorithmicMedia“, die Generierungsdaten von Stable Diffusion und ComfyUI. Das Plugin liest sie beim Hochladen und bei jeder Prüfung – auf deinem Server, nichts verlässt ihn.',
								'ai-act-labels'
							) }
						</p>
						<p>
							{ __(
								'Fehlt eine Spur, heißt das nichts: Screenshots, Exporte und Bildoptimierer entfernen sie. Deshalb zeigt „Verwendet, nicht entschieden“ alles, was auf deiner Website zu sehen ist und noch keine Entscheidung hat. Nur du weißt sicher, wie ein Bild entstanden ist.',
								'ai-act-labels'
							) }
						</p>
					</Card>
				</Section>
				<Section
					title={ __( 'Dieses Wissen als Skill', 'ai-act-labels' ) }
				>
					<Card className="aal-prose">
						<p>
							{ __(
								'Der Assistent denkt mit einem Skill: eine Anleitung mit Quellen zum AI Act, im Plugin unter skills/eu-ai-act-labels. Dieselben Dateien kannst du jedem KI-Agenten geben, der Agent Skills liest – Claude, Cursor, Codex und andere.',
								'ai-act-labels'
							) }
						</p>
						<span className="aal-row-inline">
							<Button
								size="sm"
								href={ boot.skill }
								external
								icon="book"
							>
								{ __( 'SKILL.md ansehen', 'ai-act-labels' ) }
							</Button>
							<Button
								size="sm"
								kind="ghost"
								icon="sparkle"
								onClick={ onAsk }
							>
								{ __(
									'Den Assistenten fragen',
									'ai-act-labels'
								) }
							</Button>
						</span>
					</Card>
				</Section>
			</div>

			<Section
				title={ __( 'Quellen', 'ai-act-labels' ) }
				hint={ __(
					'Stand 9. Oktober 2026. Das ist eine Hilfe, keine Rechtsberatung.',
					'ai-act-labels'
				) }
			>
				<Card pad0>
					{ SOURCES.map( ( [ name, url ] ) => (
						<div className="aal-row" key={ url }>
							<a
								className="aal-row__main"
								href={ url }
								target="_blank"
								rel="noreferrer"
							>
								<span className="aal-row__t">
									<b>{ name }</b>
									<span>
										{
											url
												.replace( /^https:\/\//, '' )
												.split( '/' )[ 0 ]
										}
									</span>
								</span>
								<Icon name="external" size={ 14 } />
							</a>
						</div>
					) ) }
				</Card>
			</Section>
			<Promo wizards={ state.wizards } />
		</>
	);
}
