# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Pre-implementation. No source code, no `package.json`, no build tooling, no tests yet. What exists:

- `assets/spritesheet-breakout.png` + `assets/spritesheet.js` — sprite coordinate map and a loader (`loadSpritesheet`, `drawSprite`, `drawFrame`) for a plain `<canvas>` 2D context. No framework, no bundler — this is meant to be dropped into vanilla JS and loaded via `<script>` tag.
- `assets/sounds/*.mp3` — `ball-bounce.mp3`, `break-sound.mp3`.
- `SPRITES` in `spritesheet.js` defines source rects for `paddle`, `ball`, and `blocks.<color>` (gray/red/yellow/cyan/magenta/hotpink/green); `EXPLOSION_FRAMES` gives 4-frame break animations per color, `EXPLOSION_DURATION` 150ms.
- `drawSprite(ctx, name, x, y, w, h)` looks up sprites by name, with `block_<color>` resolving into `SPRITES.blocks[color]`.

There is no build/lint/test command to run yet — none of that tooling exists in this repo.

## Workflow: spec-driven development

This repo is set up to use spec-driven skills (`.claude/skills/spec`, `.claude/skills/spec-impl`, sourced from `Klerith/fernando-skills` per `skills-lock.json`):

- `/spec <feature description>` — before writing any code for a new feature, use this to interactively build a spec into `specs/NN-slug-name.md`. It asks clarifying questions in batches and won't skip that phase.
- `/spec-impl <NN-spec-name>` — implements an approved spec. Requires the spec's state to say "Approved", creates/switches to a git branch named after the spec, and implements step by step with pauses to review diffs.

When asked to build the Arkanoid game (or any feature) from scratch, prefer running `/spec` first rather than improvising architecture, since no architectural conventions exist yet to follow.
