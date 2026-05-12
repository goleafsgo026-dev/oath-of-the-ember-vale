# Oath of the Ember Vale

A browser-playable Phaser 3 dark medieval fantasy action RPG vertical slice.

This rebuild keeps the rich painted pixel-art overworld and dungeon style while replacing the broken collage prototype with real playable systems underneath it: bounded areas, explicit collision zones, y-depth sorting, animated player movement/attacks, mouse-facing sword combat, enemy AI, boss behavior, area transitions, and win/defeat/restart flow.

## Play

```bash
npm install
npm run dev -- --port 5173
```

Open `http://localhost:5173/`.

## Build

```bash
npm run build
npm test
npm run preview -- --port 4173
```

## Controls

- `WASD` or arrow keys: move
- Mouse move: aim/facing
- Left click: sword attack toward the cursor
- `E`: talk to the ranger or open the ember chest
- `F3`: toggle collision/hitbox debug overlays

## Game Loop

Begin at the title screen, walk the Lantern Road, speak with the ranger, fight moving goblin raiders, enter the ruined gate, defeat the Grave Knight boss in Moonwell Ruins, then open the ember chest for victory. Losing all health triggers a defeat ending with restart.

## Technical Notes

- The release view hides debug overlays by default.
- The visible rich overworld and dungeon art are used as scene bases, with gameplay bodies layered underneath.
- Major visual objects, water/chasm/wall areas, and map edges have explicit Arcade Physics collision zones.
- The player uses a 4-direction animated warrior spritesheet for idle, walk, and attack states.
- Sword attacks have cooldown, startup, active damage timing, recovery, a directional pixel slash effect, hit flash, knockback, and sound.
- Enemies patrol, chase, attack on cooldown, switch visual poses by state, take damage, react to hits, and die.
- The boss patrols, chases, attacks, has more health, and unlocks the chest when defeated.
- Camera and physics bounds match the visible map dimensions.
- `scripts/smoke-test.mjs` runs an automated browser smoke test with Playwright.

## Asset Notes

See [ASSET_ATTRIBUTION.md](./ASSET_ATTRIBUTION.md) for full asset and license notes.

Generated raster art:

- `public/assets/fantasy/raw/characters.png`: generated with built-in image generation for enemies and NPCs.
- `public/assets/fantasy/raw/props.png`: generated with built-in image generation for medieval fantasy environmental props.
- `public/assets/fantasy/raw/overworld.png`: generated with built-in image generation for the overworld/village/forest/castle-road backdrop.
- `public/assets/fantasy/raw/dungeon.png`: generated with built-in image generation for dungeon and ruins backdrops.

Downloaded visual assets:

- `public/assets/openart/player/warrior_sheet.png`: `4 Direction Animated Warrior` by Calciumtrice, CC-BY 4.0: https://opengameart.org/content/4-direction-animated-warrior
- `public/assets/openart/fx/pixel_art_sword_slash_sprites.png`: `Pixel art sword slash effect` by tbbk, CC0: https://opengameart.org/content/pixel-art-sword-slash-effect

Downloaded CC0 audio from OpenGameArt:

- `peasantry.ogg` by nihilocrat, CC0: https://opengameart.org/content/peasant-theme
- `80 CC0 RPG SFX` by rubberduck, CC0: https://opengameart.org/content/80-cc0-rpg-sfx
- `20 Sword Sound Effects (Attacks and Clashes)` by StarNinjas, CC0: https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes
- `UI Sound Effects (Button Clicks, User Feedback, Notifications)` by Robin Lamb, CC0: https://opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications

The game uses selected copied `.ogg` files from those packs under `public/assets/fantasy/audio/sfx/` and keeps the downloaded source archives under `public/assets/fantasy/audio/downloads/` for auditability.
