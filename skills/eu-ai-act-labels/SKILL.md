---
name: eu-ai-act-labels
description: EU AI Act transparency rules (Article 50) for labelling AI-generated and AI-modified images, video, audio and text that a business publishes – the deepfake test, what needs no label, the EU's official AI icons and where they go, dates and fines. Use when deciding whether a media file on a website needs an AI label, which icon and wording to use, or when a site owner asks what the AI Act requires of them.
license: GPL-2.0-or-later
metadata:
  version: "2026-10-09"
  sources: "Regulation (EU) 2024/1689 Art. 50; Digital Omnibus on AI (in force 27 July 2026); Commission Guidelines on Article 50 (20 July 2026); Code of Practice on marking and labelling AI-generated content and EU icons (10 June 2026); Commission FAQ (24 July 2026)"
---

# EU AI Act: labelling AI media on a website

Knowledge as of 9 October 2026. This is guidance for site owners, not legal advice – say so once when a
decision is borderline, and point to the official sources in `references/sources.md`.

## The rules in one screen

- **Since 2 August 2026** Article 50 applies. The Digital Omnibus did **not** postpone it (it postponed
  high-risk rules). Only the providers' machine-readable marking (Art. 50(2)) for systems already on the
  market got until **2 December 2026**.
- **Who:** a business that publishes AI media is a *deployer*. The duty follows control: who generates
  or uses the image for the site and publishes it must disclose – not the tool maker. Purely personal,
  non-professional use is outside the Act.
- **What must be labelled (Art. 50(4)):**
  1. **Deepfakes** – AI-generated or AI-manipulated *image, audio or video* that resembles existing
     persons, objects, places, entities or events and would falsely appear authentic or truthful.
  2. **AI-generated or AI-manipulated text published to inform the public on matters of public
     interest** – unless a human reviewed it or someone holds editorial responsibility.
- **How:** clearly and distinguishably, perceivable without tools or clicks, **at the latest on first
  exposure** – on or right at the content, not only in the imprint or a privacy page. The provider's
  hidden watermark or metadata does not count for the deployer.
- **Fines:** up to EUR 15 million or 3 % of worldwide annual turnover; national market surveillance
  authorities enforce. SMEs get proportionality, not an exemption.

## Deciding one media file

Ask in this order and stop at the first clear answer:

1. **Was AI involved at all?** Traces in the file (C2PA "Content Credentials", IPTC digital source type
   `trainedAlgorithmicMedia` / `compositeWithTrainedAlgorithmicMedia`, Stable Diffusion/ComfyUI data)
   are strong evidence; file names like `Gemini_Generated_Image…` or `ChatGPT Image…` are hints. No trace
   is no proof – screenshots and exports drop metadata. Only the owner knows for sure: ask.
2. **Only standard editing?** Cropping, exposure, colour, noise reduction, removing dust, upscaling,
   retouching that keeps substance, tone and purpose → **no label needed** (`none`). Generative fill,
   replaced backgrounds, added or removed people or objects, swapped faces, outpainting → AI-modified.
3. **Generated or modified?**
   - `generated`: made by AI from a prompt, no camera image behind it (apart from prompting).
   - `modified`: a real photo, video or recording changed with AI in a way that matters.
4. **Is it a deepfake (label required)?** Does it look real *and* show something that exists or could
   plausibly exist – a person (also an invented but photorealistic one), a product, a place, an event –
   so that the actual audience could take it for authentic? Intent does not matter; a lower threshold
   applies when the audience includes children or other vulnerable people. Then the label is **required**.
5. **Not a deepfake?** Obvious illustrations, cartoons, stylised art, abstract backgrounds, icons, clearly
   fantastical scenes are not deepfakes – a label is **voluntary** (and still recommended for trust).
6. **Created before 2 August 2026?** No retroactive duty (the date of generation counts); the Commission
   encourages labelling anyway.
7. **Artistic, creative, satirical or fictional work?** Still disclose, but in a way that does not hamper
   the display or enjoyment of the work (e.g. in the credits or caption instead of on the image).

Typical results for a business website:

| Media | Result |
|-------|--------|
| Photorealistic AI "team photo", "customer", testimonial portrait | generated, **required** |
| Real photo with background replaced or person added by AI | modified, **required** |
| AI product shot that looks like a real photo of the real product | generated, **required** |
| AI image of a real building, street or event | generated or modified, **required** |
| Stylised AI illustration, icon set, abstract header graphic | generated, voluntary |
| Real photo, colour-corrected or denoised with AI tools | none |
| Stock photo, camera photo, no AI | none |
| AI voice reading a text in a video | modified or generated audio; required if it imitates a real person's voice |

## Labelling

- Use the **EU icons** (free, no attribution, optional but recommended): *basic* "AI" (round), *AI
  GENERATED* and *AI MODIFIED* (pills); black, white and both at 50 %. Use GENERATED for fully generated,
  MODIFIED for partly altered, the basic icon with a text label or a second layer, or when space is short.
  Details in `references/icons-and-placement.md`.
- Put it **in the content**: a corner of the image or video that does not cover meaningful parts, for
  the whole duration of a video, next to audio players and in audio artwork, beside AI text.
- Give it an **accessible name** ("AI-generated: This image was created with AI.") – never replace or
  stuff the image's alt text; alt text describes the image.
- Plain words, no jargon, no abbreviations besides "AI"/"KI". Good German: „KI-generiert“, „Mit KI
  verändert“, „Dieses Bild wurde mit KI erzeugt.“ Good English: "AI-generated", "Modified with AI",
  "This image was created with AI."
- Naming the tool ("Werkzeug: Midjourney") is welcome, not required.
- A site-wide statement ("we use AI images") is fine *in addition*, never instead.

## When answering site owners

- Be concrete: say which files need a label, which one, and why in one sentence each.
- Separate **required** from **voluntary** – owners worry about fines; do not inflate duties.
- When you cannot see whether AI was used, ask one short question instead of guessing.
- Chatbots on the site: the duty to tell people they talk to an AI sits with the *provider* of the chat
  system (Art. 50(1)); a site owner should still make sure the widget says so from the first message.
  See `references/text-and-chatbots.md`.

## References

- `references/article-50.md` – the paragraphs, actors, dates, Digital Omnibus, enforcement.
- `references/deepfakes.md` – the deepfake test in detail, standard editing, exceptions, examples.
- `references/icons-and-placement.md` – the EU icons, variants, placement and accessibility rules.
- `references/metadata.md` – C2PA, IPTC digital source types, SynthID: what traces mean and their limits.
- `references/text-and-chatbots.md` – AI text on matters of public interest, human review, chatbots.
- `references/sources.md` – official documents and links.
