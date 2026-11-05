# Credits

## R2 city expansion
- Crown Heights, Ashline Docks, interiors, rooftops, sky terrace, Ring Line stations and train car: procedurally built for this project (`city.js`). No new third-party assets.

## v2 (root of the site)
- **Characters:** "Universal Base Characters" (Superhero male/female bodies and the Long, Buns, Buzzed, SimpleParted and Beard hairstyles) and "Universal Animation Library" clips, both by Quaternius (https://quaternius.com), CC0 1.0. Taken from the GLB/glTF conversions in the public CC0 project github.com/lord3nd3r/ffxi-browser. Changes: textures resized to 512 px JPEG, only 8 animation clips kept, scale and translation tracks stripped; in engine they get procedural skinned clothing (smoothed shells), coat skirts, aprons, hats, hoods, glow gear, palette tints and a rim-light shader. Files: `models/ubc-*.glb`. See `models/UAL-LICENSE.txt`.
- **Character portraits (`portraits/*.jpg`):** original images generated with an AI image generator for this project. They depict original characters only.
- **Engine:** three.js r169 (MIT), including GLTFLoader, SkeletonUtils, BufferGeometryUtils and the UnrealBloom post-processing passes.
- **Districts (Saltgate, Lantern Market, Line 9 Approach and Plaza, Velvet Canal), neon signs, rain, steam, traffic, the train and the Ladle:** procedurally built for this project.
- **Audio:** rain, ambience, crowd, canal water and train rumble are synthesized at runtime with WebAudio. (Since R6, voice lines and some ambience also ship as mp3 files; see the R6 section.)
- **Story, quests, characters, names and text:** original. The game is inspired by the mood of cozy cyberpunk life sims but contains no assets, names or text from Nivalis or Cloudpunk.

## v1 (`/v1/`)
- **Characters and street props:** "Mini Mike's Metro Minis" by Mike Judge (@mikelovesrobots), https://github.com/mikelovesrobots/mmmm
  License: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: the models were tinted toward a night palette and re-lit in engine.
  Files are in `/vox` and `/v1/vox`.
- Everything else in v1 is the same as above: three.js (MIT), procedural world, synthesized audio, and original story.

## R3
- Character creator, job boards (Tide/Wardline/Orrin), apartment leasing + decorating, look-based faction perception. All procedural, no new assets.

## R6 audio: voices and street ambience
- **Main-cast voice lines (`audio/voice/*.mp3`):** generated locally with **Kokoro-82M** (hexgrad/Kokoro-82M, Apache-2.0) through `kokoro-onnx` (MIT), v1.0 int8 model and voice pack. Voices are the stock Kokoro voices, some blended (see `audio/voice/VOICES.md`). Mono MP3, 32 kbps. Only the main cast is voiced. Street extras are not voiced.
- **Street ambience (`audio/amb/*.mp3`)**, re-encoded to mono 40 kbps MP3 and loudness-normalized:
  - `crowd.mp3`: "Scifi City - Ambient Loop" (busy_cyberworld.ogg) by TinyWorlds, CC0. https://opengameart.org/content/scifi-city-ambient-loop
  - `traffic.mp3`: "High traffic road sounds" (gatve Varniu.ogg) by IgnasD, CC0. https://opengameart.org/content/high-traffic-road-sounds
  - `rain.mp3`: "Rain (loopable)" (track 3) by Ylmir, CC0. https://opengameart.org/content/rain-loopable
  - `siren.mp3`: "Storm & Siren" (storm_3_siren.ogg) by TinyWorlds, CC0, low-passed to sound distant. https://opengameart.org/content/storm-siren
  CC0 needs no attribution. It's listed here anyway, with thanks.

## R12 characters and robots
- **Humans (`models/g3/*-lo.glb`, r15):** Full **Quaternius Ultimate Modular Men + Women** packs (https://quaternius.com/packs/ultimatemodularcharacters.html · ultimatemodularwomen.html), CC0 1.0. Added hoodie/casual/beach/swat/farmer/astronaut/business/suit_f/soldier_f/worker_f/woman_casual/scifi_f/adventurer_f/witch/hooded_f; android=SciFi (Hazmat source has incompatible IK/no-wrist rig — SciFi + synthetic chrome); cyborg=Adventurer_M (backpack stripped). King skipped (medieval). Cast gets exclusive bodies; crowds mix the rest by district. Same Blender pipeline as r14 (`/workspace/q14/conv.py`).
- **Humans (r14 baseline):** **Quaternius Ultimate Modular Characters** (https://quaternius.com), CC0 1.0: Punk_F (woman), Punk_M (man), Suit (businessman), Soldier (police-officer), Worker (dock worker, file key `teen-character`), SciFi (sci-fi-soldier, android, cyborg) and Hooded (ninja). Changes in Blender: bundled animations, weapons and props removed, armature scale applied, IK feet reparented to the shins, a toe bone added, bones renamed to the engine's names. About 5.5k triangles each, one file used for both cast and crowds. In engine, the 8 Quaternius Universal Animation Library clips are retargeted onto the skeleton, and bodies get a clothing tint, rim light, neon trim rings and small glow accessories. (Grab3D humans used in r12–r13 were removed in r14.)
- **Robots (`models/robots/*.glb`):** from Quaternius (https://quaternius.com), CC0 1.0. All five come from the Sci-Fi Essentials Kit: CP_Flying, CP_Robot_2Legs, Enemy_EyeDrone, Enemy_Trilobite and Enemy_QuadShell. Only human-scale or smaller robots are used. Changes: textures resized to 512 px, scaled in engine to 0.45 to 1.25 m, and given a glow eye.
- The UBC bodies (`models/ubc-*.glb`) remain as the fallback rig (`?ubc` in the URL) and as the animation source.

## R11b / R13
- Harbor Rise roads, canal plazas, and the ride-along Ring Line car with its live window view: procedurally built for this project. No new third-party assets.

## R14b vehicles
- **Quaternius — Cars bundle** (Car, SUV, Sports Car, Taxi, Police Car and variants), CC0 1.0. https://quaternius.com/packs/cars.html · https://poly.pizza/bundle/Cars-Bundle-FE5IWe6OMk → `models/cars/car1-7.glb`
- **Hover car — Pixor library (Frakassets)**, CC0 1.0. https://pixor.art/library/vehicles/hover-car/ → `models/cars/hover.glb`
- District paint tints and neon sill/underglow trims are added in code (`cars.js`).

## R15 gunplay (on branch r15 — not in r14c)
- **Quaternius Modular Gun Pack** (Pistol_1, Pistol_3, SMG_2, AR_1), CC0 1.0. https://quaternius.com · https://poly.pizza → `models/guns/{pistol1,pistol3,smg2,ar1}.glb`. In engine: barrel remapped to −Z, Main material recolored to each gang's neon emissive, scaled to weapon length.
- **Combat clips** (Death, HitRecieve, HitRecieve_2) extracted from Quaternius Ultimate Modular Characters Punk_M.glb, CC0 1.0. Bones renamed to the g3 names; meshes stripped. Aim/shoot/run-shoot clips omitted for now — retarget shortened the body. File: `models/guns/combat-anims.glb`.
