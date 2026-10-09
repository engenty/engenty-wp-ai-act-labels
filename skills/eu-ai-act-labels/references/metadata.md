# Traces of AI in files

Machine-readable marks are the **providers'** duty (Art. 50(2)); for a deployer they are evidence, not a
label. A visible label is needed regardless of metadata.

## C2PA – Content Credentials

A signed manifest embedded in the file (JPEG: APP11 segments with a JUMBF box labelled `c2pa`; PNG: `caBX`
chunk; WebP, MP4, MP3, WAV supported). Records the claim generator (the tool) and actions; generative
actions carry an IPTC digital source type. Written by ChatGPT/DALL·E, Google (Gemini, Imagen, Pixel),
Adobe (Firefly, Photoshop generative fill), Microsoft, Meta, Leica/Sony/Nikon cameras (as capture) and
others. Social networks and many CMS image pipelines strip it.

## IPTC digital source type

Vocabulary `http://cv.iptc.org/newscodes/digitalsourcetype/`, in XMP (`Iptc4xmpExt:DigitalSourceType`)
and inside C2PA:

| Code | Meaning | Label |
|------|---------|-------|
| `trainedAlgorithmicMedia` | created by a trained model (generative AI) | generated |
| `compositeWithTrainedAlgorithmicMedia` | composite including generative AI elements | modified |
| `algorithmicMedia` | created purely by an algorithm, no training data | generated (rarely AI in the Act's sense – check) |
| `compositeSynthetic` | composite of synthetic elements | modified |
| `algorithmicallyEnhanced` | minor algorithmic improvement | usually standard editing: none |
| `digitalCapture`, `computationalCapture`, `negativeFilm`, `positiveFilm`, `print`, `minorHumanEdits`, `humanEdits`, `compositeCapture`, `digitalCreation`, `screenCapture`, `virtualRecording`, `dataDrivenMedia`, `composite` | no generative AI | none |

## Generation data

- Stable Diffusion (AUTOMATIC1111, Forge): PNG text chunk `parameters` ("Steps: …, Sampler: …"), JPEG EXIF UserComment.
- ComfyUI: PNG text chunks `prompt` and `workflow` (JSON with `class_type`).
- InvokeAI: `invokeai_metadata`, `sd-metadata`, `Dream`. NovelAI: `Software: NovelAI`.

## Invisible watermarks

SynthID (Google), Meta Video Seal, OpenAI and others embed watermarks in pixels or audio; they need the
provider's detector and are not readable by a website. Their presence is likely for many generated files.

## Limits

- No trace is no proof: screenshots, exports, messaging apps and image optimisers drop metadata.
- A trace says AI was involved, not whether the result is a deepfake – the deployer still decides.
- File names (`Gemini_Generated_Image_…`, `ChatGPT Image …`, `DALL·E …`) are hints only.
