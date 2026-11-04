# Neon Ladle: review notes (r7)

Landscape-first, first-person/third-person cyberpunk life-sim for phones. Plain ES modules plus Three.js (vendored in `lib/`). There's no build step, and it's served as a PWA from GitHub Pages.

## Architecture
| File | Role |
|---|---|
| `index.html`, `style.css` | HUD, dialogue, menus, title. Sized to the visual viewport with safe-area insets. |
| `game.js` | Main module: renderer and post, save/load and migration, quest engine (`qStart`/`qAdv`/`emit`/`talk`), NPC schedules and routing, player and camera, interactables, jobs, apartments, the Ladle cook UI, hover bike, map and main loop. |
| `world.js` | Saltgate core (street, Lantern Market, Line 9 approach/plaza, canal), batching helpers (`Batch`), sign textures, shared materials. Pushes walk rects. |
| `city.js` | Crown Heights (rich) and Ashline Docks (poor) corridors, enterable rooms (`room()`), Orrin Tower lobby and sky terrace, rooftops with ladders, metro stations. Pushes walk rects, interactables (`inter`) and rooms. |
| `causeway.js` | Ring Causeway elevated highway with three ramps (Saltgate / Crown / Ashline). |
| `story.js` | Cast, places, schedules (`SCHED`, minutes from 18:00), chat and topic text, Chapters 1–2 (`m1`–`m8`), side quests `s1`–`s9`. |
| `story5.js` | Acts 3–5 (`m9`–`m12`), five endings. |
| `r5.js` | Late systems: Node 14 interior, faction rep and Tide membership, romance dates, street events (fights/checkpoints/rumours), endings (`endGame`), epilogue. |
| `chars.js` | Parts-based characters on Quaternius CC0 bodies, LOD, umbrellas. |
| `env.js` | Weather and day/night (one day is about 24 real minutes). |
| `input.js` | Touch stick and look, plus keyboard (WASD/E/V/M/Esc). |
| `ladle.js`, `props.js` | Optional noodle-bar side gig and props. |
| `voice.js` | Kokoro-generated voice lines (`audio/voice/`) and district street ambience. |
| `sw.js` | Network-first service worker. Bump `C` on every deploy (currently `nl-r7`). |
| `tools/voice/` | `extract.mjs` (pull lines) and `gen.py` (Kokoro TTS). |
| `tools/test/` | Headless Playwright tests (see below). |

**Quest model.** A quest is `{t, main, ch, steps:[{d, at, on, say?}], done?}`. `at` is an NPC key, `[x,z]` coordinates, or a function that returns either one, and it drives the waypoint beam and edge arrow. `on` is an event string (`talk:k`, `interact:id`, `staff:Name`, `enter:district`, `count:key:n`, `serve:who:dish`). Steps with `say` open dialogue, and an option with `adv:1` advances the step. Chapter hand-offs run inside `done()`, sometimes on a timer.

**Walkability.** `W.walk` is a list of axis-aligned rects `[x0,x1,z0,z1,y]`. `walkable(x,z)` tests the rect **union** with a 0.3 m body radius: the centre plus four offset points must each fall in some rect on the player's level. Rects are bucketed on a 4 m grid, and the grid rebuilds when `W.walk` grows. Levels change only by teleport (ladders, elevators, metro, the Node 14 seal).

**Save.** `localStorage.neonLadle2` holds `S`, saved every 5 s and on `pagehide`/hidden. Settings live in `nlSettings` and audio in `nlAudio2`. Migrations run at load: v1 to v2, R6 (the old Ladle-owner chain m2/m3 folds into the newcomer opening), and R7 (re-starts any missing chapter hand-off and repairs `S.track`).

## r7 fixes
- **Juno-7 hand-off (A Cold Trail → Static on Line 9):** `stepTarget` returned null whenever the NPC was hidden by the 70 m draw-distance cull, so at night (Juno at the houseboat or Line 9) the waypoint disappeared. It now follows the NPC's live position whenever the NPC is scheduled anywhere. m7 (the ledger choice) also had no marker (`at:null`), and it now points to Juno or Ilse.
- **Invisible walls at seams:** the per-rect 0.3 m inset turned every rect-to-rect overlap under 0.6 m into a wall. That covered all three causeway ramps (Saltgate at x=-47.2, Crown at x=-58.9, Ashline at x=-48.9). This is fixed generically with the union test described above.
- **Soft-lock:** a reload during a chapter-card timer (m8→m9, m9→m10, m10→m11, m11→m12) left no main quest. This is repaired at load.
- **Robustness:** the main loop schedules `requestAnimationFrame` before running and catches errors, so one exception no longer freezes the game. `localStorage` reads and writes are guarded (corrupt JSON, quota, private mode). The game also saves on `pagehide`/background (iOS kills PWAs).
- **HUD:** the hidden status text left a `· ·` double separator, and its dot now hides with it. The clock only writes to the DOM when its text changes.
- **Dead code removed:** `emit('interact:kitchen')` and `emit('served5')` from the old Ladle-owner quests (nothing listens for them). The "Mara holds the keys" text was updated.

## Tests (`tools/test/`, need `python3 -m http.server 8123` in the repo root and Playwright with Chrome)
- `r7_story.py`: `MODE=story` plays the whole main story from a fresh save. At four times of day, every step must have a scheduled NPC or target, be reachable by multi-level flood fill (ground, metro, ladders, elevators), and show a live waypoint. `MODE=ends` plays all five endings (open, fair, tide, law, chair). `MODE=shots` writes the r7 screenshots.
- `r7_seams.py`: walks across every touching or overlapping walk-rect pair on each level (120 crossings) and flags near-miss gaps that no door bridges. Current result: 0 failures, 0 gaps.
- `r7_migration.py`: loads crafted saves (m8 done, m10 done, old R6 Ladle chain, corrupt JSON).

## Known issues / open
- The story test fires triggers directly and forces relationships to 7. It proves wiring and reachability, not pacing or grind. Juno's ledger branch needs ♥5 or the Ghost Route memory, otherwise the dialogue declines (by design).
- Street-event fight enemies spawn too far away, the checkpoint officer can spawn on top of the player, and event actors have no collision.
- Distant causeway lamps are dim (light-pool budget of 18, or 10 on low).
- Characters without a portrait can't open portrait dialogue.
- The R6 migration resets an in-progress old-chain save to the start of `m1`.
- Nothing has been profiled on-device. Known mobile costs: the post composer, a cube-camera env bake every 1.5 game hours, and about 1 DOM write per frame for the HUD/waypoint. `tickNPCs` runs every NPC every frame.
- Walk geometry is rect-only, so diagonal or curved edges are approximated. NPC routing is a district join graph, not a navmesh.
- Large single-file `game.js` (dense one-line style). A module split would help maintainers.
