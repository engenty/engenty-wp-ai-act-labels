=== AI Act Image Labels ===
Contributors: engenty
Tags: ai act, ai label, ai generated, media library, eu
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 0.1.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Marks AI-generated and AI-modified media as the EU AI Act asks – in the media library, with the EU's official icons on your site.

== Description ==

Since 2 August 2026, Article 50 of the EU AI Act asks businesses to label images, videos and recordings that look real but were made or changed with AI. AI Act Image Labels puts that decision where your media lives.

* A decision per file in the media library: AI-generated, modified with AI or no label needed – in the details, as bulk actions, with a filter and a column.
* The European Commission's official icons (AI GENERATED, AI MODIFIED, AI) in a corner of the image, with the notice for screen readers and on hover – never in the alt text.
* Works by itself for featured images, blocks, galleries, covers, video and audio; finds images in HTML blocks and page builders by their file; functions for themes.
* Reads traces of AI in your files on your server: C2PA Content Credentials, IPTC digital source type, Stable Diffusion and ComfyUI data, file names of AI tools.
* Shows where each file is used and opens those pages to check the label really appears.
* An assistant that knows the AI Act and says what needs a label – using the AI provider set up under Settings › Connectors (WordPress 7.0+). Everything else works without AI.
* Configurable icon, colour, size, corner and words.

The tool is under Tools › AI labels. This plugin helps with labelling; it is not legal advice.

== Installation ==

1. Install the plugin from Plugins › Add New, or upload the zip under Plugins › Add New › Upload Plugin.
2. Activate it. The tool opens under Tools › AI labels.
3. Click "Check site": the plugin reads where your media is used and looks for traces of AI in the files.
4. Decide per file in the Review tab or in the media library. Labelled media show the icon on the site right away.
5. Optional: for the assistant, set up an AI provider under Settings › Connectors (WordPress 7.0 or later).

== Frequently Asked Questions ==

= Do I have to label every AI image? =

No. Article 50 asks for a label on content that looks real and could be taken as real – deepfakes: photorealistic people, products, places or events. Obviously artificial images (illustrations, comics, abstract backgrounds) and ordinary editing (crop, colour, light, noise, upscaling) need no label. The Knowledge tab explains the rules with sources.

= Does the plugin find AI images by itself? =

It reads traces that many AI tools write into the file: C2PA Content Credentials, the IPTC value "trainedAlgorithmicMedia", Stable Diffusion and ComfyUI data, and the file names of AI tools. A missing trace proves nothing – screenshots, exports and image optimizers remove them. You decide; the plugin suggests.

= Where does the label appear? =

As the EU icon in a corner of the image or video, with the notice for screen readers and on hover, and behind captions that are shown anyway. Never in the alt text. Featured images, blocks, galleries, covers, video and audio get it by themselves. A theme that prints images itself can call ai_act_labels_wrap().

= Do I need an AI provider? =

No. Labelling, the check, the traces in files and the icons work without one. Only the assistant needs a provider set up under Settings › Connectors (WordPress 7.0 or later).

= Can I use my own icon? =

Yes: the EU icon by kind, the round EU icon, the round icon that opens on hover, your own image or a sparkle, in black, white, 50 % or picked by image, in three sizes and four corners.

= Is the EU icon free to use? =

Yes. The European Commission published the icons in June 2026 for free use, without attribution. The plugin ships them unchanged.

== Screenshots ==

1. Review: what carries traces of AI, what is used on the site and has no decision yet, with suggestions to apply in one click.
2. Appearance: icon, colour, size, corner and words, with a live preview on one of your images.
3. Knowledge: the rules of Article 50 in plain words, with sources.
4. The decision in the media library, with the EU icon and the traces found in the file.
5. A labelled image on the site, with the notice on hover.

== External services ==

The plugin itself sends nothing to outside services and loads nothing from outside servers. Two features make requests:

= The assistant (optional) =

When you ask the assistant or let it assess files, the plugin sends your question and, for each file concerned, the image, its file name, title, the traces found, where it is used (page titles) and its current decision to the AI provider you set up under Settings › Connectors. WordPress' AI Client makes the request; which service receives it, and its terms and privacy policy, depend on the provider you chose there. Nothing is sent while no provider is set up or when you do not use the assistant.

= "Check on the site" =

This check opens the pages of your own site where a file is used (at most six per file) to see whether the label appears. The requests go only to your own site's address.

The tool shows a link to engenty.ai, the maker of the plugin. Following it is your choice; the plugin does not contact engenty.ai.

== Changelog ==

= 0.1.0 =
* First release.
