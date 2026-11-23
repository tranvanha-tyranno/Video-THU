# Video skills and templates downloaded on 2026-11-22

The archives, extracted files and SHA-256 receipts are under `sources/` in
this checkout. Each `snapshot/` directory contains the original repository
layout. The local `sources/acquisition.json` receipt lists all commits and
archives, including the 19 iArt packs.

## iArt Motion Skills

The catalog and its 19 packs contain 56 skills. The catalog is under
`sources/iart-ai__motion-skills/snapshot/` and each pack is under
`sources/iart-ai__<pack>/snapshot/`. Use the catalog to find techniques for
kinetic typography, data visualization, explainer staging, WebGL and Manim.
Nine skills are installed in `.agents/skills/` for this project's video workflow.

- Direction and timing: `motion-art-direction`, `shot-composition`,
  `animation-principles`.
- Explainers and data: `explainer-video`, `diagram-animation`,
  `animated-infographic`, `chart-animation`.
- Visual techniques: `kinetic-typography` and `threejs-animation`.

Apply these techniques against the current brief and the established renderer.
The full catalog is available locally for other production needs.
[iArt catalog at the downloaded commit](https://github.com/iart-ai/motion-skills/tree/e8ba1f4eb2bcca3d1639d7545b9cd2bcfe4a3c6f)

## AI Video Generation

The project skill is at `.agents/skills/ai-video-generation/SKILL.md` from the
repository root. Consult it for a task that calls for inference.sh, including
model selection, image-to-video, lip-sync and Foley. Its generation examples
require the `belt` CLI and a provider account. This acquisition verified the
skill files locally. Provider execution was outside the download.
[MCP Servers listing](https://mcpservers.org/vi/agent-skills/101-skills/ai-video-generation)
· [Upstream skill at the downloaded commit](https://github.com/inference-sh/skills/tree/13ccb5ea05deaa3ff9c8ba5c78d1e37756cc14b5/tools/video/ai-video-generation)

## Auto Compare Video

The template is under `sources/Cuongyd196__auto-compare-video/snapshot/`.
It includes two Vietnamese HyperFrames projects, Dev vs DevOps and Thiên thạch
vs Sao băng, as well as previews and voice assets. Use it as a reference for
short vertical comparisons, measured narration cues and Vietnamese typography.
Its bundled `create-video` skill expects paths relative to the template's own
root. The template and its skill are kept together in the snapshot.
[Auto Compare Video at the downloaded commit](https://github.com/Cuongyd196/auto-compare-video/tree/50b1f34a7b1fdf309695ca4391bb8fd805d05b24)
