# Oath of the Ember Vale

A browser-playable Phaser 3 pixel-art medieval fantasy action RPG scene.

This rebuild keeps the rich painted pixel-art overworld style while replacing the broken collage prototype with a bounded playable scene, explicit collision zones, y-depth sorting, mouse-facing sword combat, enemy AI, boss behavior, and win/defeat/restart flow.

## Play

```bash
npm install
npm run dev -- --port 5173
```

Open `http://localhost:5173/`.

## Build

```bash
npm run build
npm run preview -- --port 4173
```

## Controls

- `WASD` or arrow keys: move
- Mouse click: sword attack
- Mouse move: aim/facing
- Left click: sword attack toward the cursor
- `E`: talk to the ranger or open the ember chest
- `F3`: toggle collision/hitbox debug overlays

## Game Loop

Begin at the title screen, walk the Lantern Road, speak with the ranger, fight moving goblin raiders, defeat the Grave Knight boss, then open the ember chest for victory. Losing all health triggers a defeat ending with restart.

## Technical Notes

- The release view hides debug overlays by default.
- The visible rich overworld art is used as the scene base.
- Major visual objects and map edges have explicit Arcade Physics collision zones.
- Enemies patrol, chase, attack on cooldown, take damage, react to hits, and die.
- The boss patrols, chases, attacks, has more health, and unlocks the chest when defeated.
- Camera and physics bounds match the visible map dimensions.

## Asset Notes

Generated raster art:

- `public/assets/fantasy/raw/characters.png`: generated with built-in image generation for the hero, enemies, and NPCs.
- `public/assets/fantasy/raw/props.png`: generated with built-in image generation for medieval fantasy environmental props.
- `public/assets/fantasy/raw/overworld.png`: generated with built-in image generation for the overworld/village/forest/castle-road backdrop.
- `public/assets/fantasy/raw/dungeon.png`: generated with built-in image generation for dungeon and ruins backdrops.

Downloaded CC0 audio from OpenGameArt:

- `peasantry.ogg` by nihilocrat, CC0: https://opengameart.org/content/peasant-theme
- `80 CC0 RPG SFX` by rubberduck, CC0: https://opengameart.org/content/80-cc0-rpg-sfx
- `20 Sword Sound Effects (Attacks and Clashes)` by StarNinjas, CC0: https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes
- `UI Sound Effects (Button Clicks, User Feedback, Notifications)` by Robin Lamb, CC0: https://opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications

The game uses selected copied `.ogg` files from those packs under `public/assets/fantasy/audio/sfx/` and keeps the downloaded source archives under `public/assets/fantasy/audio/downloads/` for auditability.
