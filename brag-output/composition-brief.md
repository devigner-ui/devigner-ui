# Hyperframes Composition Brief: Devigner UI

## Objective
Create a 20-second launch video for Devigner UI that shows the product workflow from component selection to a local `.tsx` file.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape, 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `D:/Work D/Development Projects/new/devigner`
- Primary files read: `README.md`, `apps/docs/app/page.tsx`, `apps/docs/app/globals.css`, and the landing Hero, HeroWindow, States, and Install components
- Product name: Devigner UI
- Key UI: live component canvas with cobalt selection handles, selectable component list, command toolbar, terminal, and file tree
- Copy that must appear verbatim: `npx devignerui add magnetic-button`; `components/ui/magnetic-button.tsx`; `A normal file in your repo.`

## Creative Direction
- Tone preset: polished
- Creative direction: concise product film seen through a design tool
- Hook: the cobalt selection outline locks onto an actual component preview in the first 2.5 seconds
- Outro: `Beautiful motion. Your code.`
- Avoid generic SaaS copy, abstract filler, and unrelated visual language

## Visual Identity
- Background: `oklch(97.6% 0.003 260)`, approximate RGB `#f7f8fa`
- Text: `oklch(19% 0.012 260)`, logo ink `#151922`
- Accent: `oklch(53% 0.215 264)`, logo cobalt `#365ee9`
- Display and body: Geist Sans; monospace: Geist Mono; wordmark: Bricolage Grotesque
- Use square component frames, restrained rounded chrome, small mono labels, and cobalt selection handles.

## Storyboard
Use `brag-output/brag-plan.md` as the creative contract.

1. Select, 2.5s: selection outline and short hook.
2. Browse, 5s: actual browser UI language and component selection.
3. Add, 4s: CLI command and success path.
4. Own, 5s: file tree and code panel.
5. End card, 3.5s: wordmark and final claim.

## Audio
- Audio role: restrained clean bed with sparse UI sounds
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music cues: bundled vol-12 preset, with optional strong accents near 8.74s, 13.11s, and 18.56s
- Audio-reactive treatment: skipped because the bundled Python extraction helper requires `numpy`, which is unavailable in this environment
- Audio-coupled moments: component selection, command entry, file placement, final mark
- SFX guidance: choose low high-frequency-risk files from the bundled SFX analysis; copy the selected sounds locally

## Composition Instructions
Use the installed Hyperframes CLI and available Hyperframes composition guidance. Build the end-state layout before motion, use deterministic seek-safe animation, and keep readable text settled. The project's shared motion tokens govern any animation added to the product source; this video composition is separate from the app. Run `hyperframes check` before render and keep the duration within 15 to 25 seconds. Use local media assets.
