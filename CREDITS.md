# Credits

## R2 city expansion
- Crown Heights, Ashline Docks, interiors, rooftops, sky terrace, Ring Line stations and train car: procedurally built for this project (`city.js`). No new third-party assets.

## v2 (root of the site)
- **Characters:** "Universal Base Characters" (Superhero male/female bodies and the Long, Buns, Buzzed, SimpleParted and Beard hairstyles) and "Universal Animation Library" clips, both by Quaternius (https://quaternius.com), CC0 1.0. Taken from the GLB/glTF conversions in the public CC0 project github.com/lord3nd3r/ffxi-browser. Changes: textures resized to 512 px JPEG, only 8 animation clips kept, scale and translation tracks stripped; in engine they get procedural skinned clothing (smoothed shells), coat skirts, aprons, hats, hoods, glow gear, palette tints and a rim-light shader. Files: `models/ubc-*.glb`. See `models/UAL-LICENSE.txt`.
- **Character portraits (`portraits/*.jpg`):** original images generated with an AI image generator for this project. They depict original characters only.
- **Engine:** three.js r169 (MIT), including GLTFLoader, SkeletonUtils, BufferGeometryUtils and the UnrealBloom post-processing passes.
- **Districts (Saltgate, Lantern Market, Line 9 Approach and Plaza, Velvet Canal), neon signs, rain, steam, traffic, the train and the Ladle:** procedurally built for this project.
- **Audio:** rain, ambience, crowd, canal water and train rumble are synthesized at runtime with WebAudio. No audio files are used.
- **Story, quests, characters, names and text:** original. The game is inspired by the mood of cozy cyberpunk life sims but contains no assets, names or text from Nivalis or Cloudpunk.

## v1 (`/v1/`)
- **Characters and street props:** "Mini Mike's Metro Minis" by Mike Judge (@mikelovesrobots), https://github.com/mikelovesrobots/mmmm
  License: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: the models were tinted toward a night palette and re-lit in engine.
  Files are in `/vox` and `/v1/vox`.
- Everything else in v1 is the same as above: three.js (MIT), procedural world, synthesized audio, and original story.
