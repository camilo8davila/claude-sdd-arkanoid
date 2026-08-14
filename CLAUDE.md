# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

A working single-page Arkanoid clone in vanilla JS — no framework, no bundler, no `package.json`. Open `index.html` directly in a browser (or serve the directory statically) to play. There is no build/lint/test command in this repo.

- `index.html` — canvas (`800x600`) plus a `<select id="levelSelect">` overlay used for manual level jumping while paused; loads `assets/spritesheet.js`, `levels.js`, `game.js` in that order via plain `<script>` tags (order matters — `game.js` reads globals defined by the other two at parse time).
- `game.js` — the entire game: state, update loop, collision, rendering. No modules; everything is a top-level global.
- `levels.js` — defines global `LEVELS`, an array of `{ isExcluded(row, col) }` predicates that carve gaps out of the full block grid per level. `isExcluded` closes over `BLOCK_ROWS`/`BLOCK_COLS` globals from `game.js`, so this file depends on load order too.
- `assets/spritesheet.js` — defines global `SPRITES` (source rects for `paddle`, `ball`, `blocks.<color>`) and `EXPLOSION_FRAMES`/`EXPLOSION_DURATION` (4-frame break animation per block color), plus `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)`, `drawFrame(ctx, frame, x, y, w, h)`. `drawSprite` resolves `block_<color>` names into `SPRITES.blocks[color]`.
- `assets/sounds/*.mp3` — `ball-bounce.mp3`, `break-sound.mp3`, played via `new Audio(src).play()` in `game.js`.

### Architecture notes (game.js)

- Single finite `gameState` string drives both `update()` and `draw()`: `'start' | 'playing' | 'paused' | 'gameover' | 'win'`. Add new states by handling them in both functions.
- Blocks are rebuilt from scratch (`createBlocks(levelIndex)`) on every level change/restart rather than mutated in place; each block carries an `alive` flag.
- `checkBlockCollisions()` only resolves one block hit per frame (`break` after the first collision) and picks bounce axis via minimum overlap.
- Level progression happens inline inside `checkBlockCollisions()` when all blocks die; the `levelSelect` dropdown (populated statically in `index.html`, only shown while `gameState === 'paused'`) is a separate, manual way to jump levels.
- Ball speed scales per level via `LEVEL_SPEED_MULTIPLIER ** levelIndex` in `launchBall()`.
- `requestAnimationFrame` loop (`loop()`) only starts after `loadSpritesheet()`'s callback fires.

## Workflow: spec-driven development

This repo uses spec-driven skills (`.claude/skills/spec`, `.claude/skills/spec-impl`, sourced from `Klerith/fernando-skills` per `skills-lock.json`):

- `/spec <feature description>` — before writing any code for a new feature, use this to interactively build a spec into `specs/NN-slug-name.md`. It asks clarifying questions in batches and won't skip that phase.
- `/spec-impl <NN-spec-name>` — implements an approved spec. Requires the spec's state to say "Approved", creates/switches to a git branch named `spec-NN-slug` (auto, per `specs/.spec-config.yml`'s `AutoCreateBranch: true`), and implements step by step with pauses to review diffs.
- Existing specs (`specs/01-mvp-arkanoid.md`, `specs/02-animacion-explosion-bloques.md`, `specs/03-niveles-y-sonidos.md`) are all in `Done`/`Implemented` state and correspond to what's already built — treat them as the design record for the current code, not open work.
- For new features, prefer running `/spec` first rather than improvising architecture, to stay consistent with the existing spec-driven history.
