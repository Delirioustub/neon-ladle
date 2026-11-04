# Neon Ladle: review notes (r8)

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
| `sw.js` | Network-first service worker. Bump `C` on every deploy (currently `nl-r8b`). |
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

## r8 fixes (Joshua's iPhone report)
- **"Invisible wall" / black boxes on the Ring Causeway:** walkable() itself was clean on every lane. The visible culprits were (a) far-skyline towers from `world.js` (random ring, radius 80–140) that landed on the causeway deck, (b) the Crown and Ashline metro kiosks standing dead centre in the ramp mouths with no collision, and (c) the spine walk rect running into the east barrier. The skyline now skips anything in the causeway band or over any walk rect. The kiosks moved off the ramp axis and are solid (`CITY.block`). The spine rect stops inside the barrier. Barrier segments and lamp posts that overlapped a ramp mouth are dropped.
- **Umbrellas floating:** the old code lerped the grip 55% toward a fixed point, so the hand never touched the shaft. It now uses two-bone CCD IK (upperarm_r/lowerarm_r → hand_r) to a raised grip by the head, and the shaft starts at the hand.
- **Sela sitting on air:** stool seats used root y=0 at the stool centre, but the `sit` clip's pelvis sits 0.29 m behind the root. Seated NPCs and customers now use a root offset of `SEAT_D`/`SEAT_Y` so the pelvis lands on the stool top, facing the counter.
- **Kitchen behind the pass:** the stock pots floated at y 1.32 in the aisle and had a walk blocker. They now sit on a back range against the rear wall, with flames, wok and steam moved to match, and the blocker is removed. The player can stand centred at "The pass". The steam puffs are soft round sprites now; square planes read as white boxes.
- **Apartments:** the starter flat and the three rentable flats are full 10×7 studios with:
  - a sleeping nook with a working bed;
  - a couch you can sit on;
  - a TV that toggles and flickers;
  - a rain-streaked city window with neon spill;
  - a kitchenette (snack: cook +20 min / tea +10 min);
  - a bathroom with a sink and a mirror that opens the look editor.
  R3 decor slots are kept. The light budget is 6 point lights per flat, and only one flat is near the player at a time.
- **Doors:** every walk-in storefront (`room()`) gets a lit frame in its sign colour, a threshold glow and an "Enter · <name>" prompt. Apartment doors, metro stairs and elevators get a bobbing glow chevron (distance-culled, under 30 m). Storefronts also show on the map.

## Tests (`tools/test/`, need `python3 -m http.server 8123` in the repo root and Playwright with Chrome)
- `r7_story.py`: `MODE=story` plays the whole main story from a fresh save. At four times of day, every step must have a scheduled NPC or target, be reachable by multi-level flood fill (ground, metro, ladders, elevators), and show a live waypoint. `MODE=ends` plays all five endings (open, fair, tide, law, chair). `MODE=shots` writes the r7 screenshots.
- `r7_seams.py`: walks across every touching or overlapping walk-rect pair on each level (120 crossings) and flags near-miss gaps that no door bridges. Current result: 0 failures, 0 gaps.
- `r8_drive.py`: drives the hover bike and then walks each causeway ramp (Saltgate, Crown, Ashline) at three lane offsets into the district through the real input loop, then runs `scenery.js`, which flags opaque scenery between knee and head height on the deck, and big blocks on any street. Current result: 18/18 routes, 0 scenery hits.
- `r8_shots.py`: writes the r8-* screenshots.
- `r7_migration.py`: loads crafted saves (m8 done, m10 done, old R6 Ladle chain, corrupt JSON).

## Known issues / open
- The story test fires triggers directly and forces relationships to 7. It proves wiring and reachability, not pacing or grind. Juno's ledger branch needs ♥5 or the Ghost Route memory, otherwise the dialogue declines (by design).
- Street-event fight enemies spawn too far away, the checkpoint officer can spawn on top of the player, and event actors have no collision.
- Distant causeway lamps are dim (light-pool budget of 18, or 10 on low).
- Characters without a portrait can't open portrait dialogue.
- The R6 migration resets an in-progress old-chain save to the start of `m1`.
- Nothing has been profiled on-device. Known mobile costs: the post composer, a cube-camera env bake every 1.5 game hours, and about 1 DOM write per frame for the HUD/waypoint. `tickNPCs` runs every NPC every frame.
- Walk geometry is rect-only, so diagonal or curved edges are approximated. NPC routing is a district join graph, not a navmesh.
- The causeway test pins heading. It doesn't model a player steering into the side barriers at speed. Wardline checkpoint stops in Crown can still feel like a wall (it's a dialog, by design).
- The apartment mirror reuses the character creator (no cost, no undo).
- Large single-file `game.js` (dense one-line style). A module split would help maintainers.
- **Indoor camera:** third person auto-switches to first person inside any room (`CITY.inRoom`), and restores on exit. The TP camera no longer sits inside the player's head in apartments.
- **"Working the Ladle" HUD:** the shift now auto-closes if you walk more than 45 m from the Ladle, so the status can't stick on while you're in the apartment or on the causeway.
- **Verified:** `r8_drive.py` walk and bike crossings Causeway↔Crown/Saltgate/Ashline: 0 fails, 0 scenery boxes on deck. `r8_umbrella.py` and `r8_shots.py`: no errors.
- **Known:** the `r8-door-home` test shot is taken from too far away to show the Enter prompt (other door prompts verified).
