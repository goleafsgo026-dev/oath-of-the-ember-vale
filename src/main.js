import './styles.css';
import Phaser from 'phaser';

const app = document.querySelector('#app');

app.innerHTML = `
  <div id="game-root"></div>
  <div class="shell">
    <section id="titleScreen" class="title-screen">
      <div class="title-copy">
        <p class="eyebrow">Medieval fantasy action RPG</p>
        <h1>Oath of the Ember Vale</h1>
        <p class="tagline">Defend the lantern road, defeat the Grave Knight, and reclaim the ember chest.</p>
        <button id="startButton" class="primary-button" type="button">Begin</button>
      </div>
    </section>
    <section id="hud" class="hud">
      <div class="hud-cluster">
        <div class="crest">
          <strong>Ember Vale</strong>
          <span id="areaText">Lantern Road</span>
        </div>
        <div class="vitals">
          <span>Health</span>
          <div class="bar"><i id="healthFill"></i></div>
        </div>
        <div class="quest-panel">
          <b>Objective</b>
          <span id="questText">Talk to the ranger, clear the road, then enter the ruined gate.</span>
        </div>
      </div>
      <div id="bossHud" class="boss-hud">
        <b>Grave Knight</b>
        <div class="bar boss-bar"><i id="bossFill"></i></div>
      </div>
      <div class="controls">
        <span>WASD move</span>
        <span>Mouse aim</span>
        <span>Click sword</span>
        <span>E interact</span>
        <span>F3 debug</span>
      </div>
      <div id="prompt" class="prompt"></div>
    </section>
    <section id="ending" class="ending">
      <div class="ending-card">
        <p id="endingEyebrow" class="eyebrow">Victory</p>
        <h2 id="endingTitle">The Road Is Safe</h2>
        <p id="endingText">The ember chest opens and Greenhollow's lanterns burn into the mist.</p>
        <button id="restartButton" class="primary-button" type="button">Restart</button>
      </div>
    </section>
  </div>
`;

const hud = {
  title: document.querySelector('#titleScreen'),
  start: document.querySelector('#startButton'),
  hud: document.querySelector('#hud'),
  area: document.querySelector('#areaText'),
  health: document.querySelector('#healthFill'),
  quest: document.querySelector('#questText'),
  prompt: document.querySelector('#prompt'),
  bossHud: document.querySelector('#bossHud'),
  bossFill: document.querySelector('#bossFill'),
  ending: document.querySelector('#ending'),
  endingEyebrow: document.querySelector('#endingEyebrow'),
  endingTitle: document.querySelector('#endingTitle'),
  endingText: document.querySelector('#endingText'),
  restart: document.querySelector('#restartButton')
};

const ASSET = {
  map: '/assets/fantasy/raw/overworld.png',
  dungeon: '/assets/fantasy/raw/dungeon.png',
  characters: '/assets/fantasy/raw/characters.png',
  warrior: '/assets/openart/player/warrior_sheet.png',
  slash: '/assets/openart/fx/pixel_art_sword_slash_sprites.png',
  music: '/assets/fantasy/audio/music/peasantry.ogg',
  audio: {
    sword: '/assets/fantasy/audio/sfx/sword-swing.ogg',
    clash: '/assets/fantasy/audio/sfx/sword-clash.ogg',
    hurt: '/assets/fantasy/audio/sfx/creature-hurt.ogg',
    die: '/assets/fantasy/audio/sfx/creature-die.ogg',
    collect: '/assets/fantasy/audio/sfx/collect.ogg',
    step: '/assets/fantasy/audio/sfx/step.ogg',
    ui: '/assets/fantasy/audio/sfx/ui-click.ogg',
    victory: '/assets/fantasy/audio/sfx/victory.ogg',
    defeat: '/assets/fantasy/audio/sfx/defeat.ogg'
  }
};

const WORLD = { width: 1672, height: 941 };
const PLAYER = { maxHp: 10, speed: 210, attackCooldown: 520, attackRange: 92, attackArc: Phaser.Math.DegToRad(54) };
const PLAYER_BASE_TINT = 0x8f7656;
const DEBUG_DEFAULT = false;

const CHARACTER_CELLS = {
  heroIdle: [0, 0],
  heroWalk: [0, 1],
  heroAttack: [0, 2],
  skeleton: [1, 0],
  skeletonWalk: [1, 1],
  skeletonAttack: [1, 2],
  skeletonHit: [1, 3],
  goblin: [2, 0],
  goblinWalk: [2, 1],
  goblinAttack: [2, 2],
  goblinHit: [2, 3],
  ranger: [3, 2]
};

const LEVEL = {
  mapKey: 'world-map',
  name: 'Lantern Road',
  spawn: { x: 720, y: 795 },
  npc: { x: 640, y: 645, line: 'The Grave Knight holds the gate. Stay on the road, bait the raiders, then strike toward your cursor.' },
  chest: null,
  exit: { x: 1390, y: 150, w: 155, h: 135, target: 1, targetSpawn: { x: 520, y: 760 }, prompt: 'Enter the ruined gate' },
  blockers: [
    { name: 'north forest canopy', x: 0, y: 0, w: 1672, h: 74 },
    { name: 'west river and brush', x: 0, y: 0, w: 74, h: 941 },
    { name: 'south brush edge', x: 0, y: 884, w: 1672, h: 57 },
    { name: 'east broken bridge gap', x: 1592, y: 0, w: 80, h: 941 },
    { name: 'great tree west', x: 250, y: 78, w: 286, h: 250 },
    { name: 'graveyard stones', x: 72, y: 260, w: 290, h: 132 },
    { name: 'tavern building', x: 737, y: 120, w: 300, h: 288 },
    { name: 'tavern barrels left', x: 675, y: 415, w: 145, h: 94 },
    { name: 'tavern barrels right', x: 838, y: 421, w: 95, h: 70 },
    { name: 'north ruin wall', x: 1048, y: 92, w: 182, h: 238 },
    { name: 'gatehouse wall', x: 1510, y: 0, w: 70, h: 275 },
    { name: 'east cliff gap', x: 1450, y: 332, w: 222, h: 320 },
    { name: 'market wagon', x: 1122, y: 520, w: 170, h: 95 },
    { name: 'south tent camp', x: 1310, y: 642, w: 244, h: 182 },
    { name: 'bottom fence west', x: 100, y: 770, w: 466, h: 76 },
    { name: 'bottom fence east', x: 1052, y: 734, w: 275, h: 66 },
    { name: 'road puddle and rocks', x: 910, y: 820, w: 130, h: 70 },
    { name: 'ember chest', x: 1274, y: 330, w: 70, h: 56 }
  ],
  depthAnchors: [
    { x: 737, y: 120, w: 300, h: 288, depthY: 390 },
    { x: 250, y: 78, w: 286, h: 250, depthY: 338 },
    { x: 1122, y: 520, w: 170, h: 95, depthY: 624 },
    { x: 1310, y: 642, w: 244, h: 182, depthY: 836 },
    { x: 1048, y: 92, w: 182, h: 238, depthY: 340 },
    { x: 1366, y: 0, w: 214, h: 275, depthY: 284 }
  ],
  enemies: [
    { kind: 'goblin', x: 1005, y: 505, patrol: [{ x: 970, y: 485 }, { x: 1110, y: 570 }] },
    { kind: 'goblin', x: 1180, y: 430, patrol: [{ x: 1135, y: 412 }, { x: 1244, y: 490 }] }
  ]
};

const DUNGEON_LEVEL = {
  mapKey: 'dungeon-map',
  name: 'Moonwell Ruins',
  spawn: { x: 520, y: 760 },
  npc: null,
  chest: { x: 1320, y: 240 },
  exit: null,
  blockers: [
    { name: 'north dungeon wall', x: 0, y: 0, w: 1672, h: 82 },
    { name: 'west chasm', x: 0, y: 0, w: 115, h: 941 },
    { name: 'south chasm', x: 0, y: 872, w: 1672, h: 69 },
    { name: 'east wall', x: 1565, y: 0, w: 107, h: 941 },
    { name: 'left temple', x: 108, y: 70, w: 490, h: 310 },
    { name: 'top water bridge gap', x: 660, y: 70, w: 395, h: 186 },
    { name: 'right treasure room wall', x: 1165, y: 72, w: 365, h: 205 },
    { name: 'right water channel', x: 1220, y: 390, w: 360, h: 160 },
    { name: 'center pillar cluster', x: 850, y: 320, w: 128, h: 104 },
    { name: 'left lower roots', x: 118, y: 440, w: 390, h: 150 },
    { name: 'bottom left chasm', x: 450, y: 735, w: 235, h: 140 },
    { name: 'bottom center water', x: 740, y: 748, w: 240, h: 130 },
    { name: 'bottom right waterfall', x: 1190, y: 720, w: 210, h: 170 },
    { name: 'right gatehouse', x: 1318, y: 518, w: 240, h: 190 },
    { name: 'ember chest ruins', x: 1270, y: 190, w: 130, h: 92 }
  ],
  depthAnchors: [
    { x: 108, y: 70, w: 490, h: 310, depthY: 388 },
    { x: 1165, y: 72, w: 365, h: 205, depthY: 286 },
    { x: 1318, y: 518, w: 240, h: 190, depthY: 720 },
    { x: 850, y: 320, w: 128, h: 104, depthY: 434 }
  ],
  enemies: [
    { kind: 'goblin', x: 740, y: 590, patrol: [{ x: 680, y: 565 }, { x: 845, y: 625 }] },
    { kind: 'boss', x: 1015, y: 525, patrol: [{ x: 930, y: 480 }, { x: 1110, y: 610 }] }
  ]
};

const AREAS = [LEVEL, DUNGEON_LEVEL];

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.image('world-map', ASSET.map);
    this.load.image('dungeon-map', ASSET.dungeon);
    this.load.image('characters-raw', ASSET.characters);
    this.load.spritesheet('warrior', ASSET.warrior, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('slash', ASSET.slash, { frameWidth: 64, frameHeight: 47 });
    this.load.audio('music-theme', ASSET.music);
    Object.entries(ASSET.audio).forEach(([key, path]) => this.load.audio(`sfx-${key}`, path));
  }

  create() {
    createChromaFrames(this, 'characters-raw', CHARACTER_CELLS, 4, 4);
    createWarriorAnimations(this);
    this.anims.create({
      key: 'slash-swing',
      frames: this.anims.generateFrameNumbers('slash', { start: 0, end: 8 }),
      frameRate: 28,
      repeat: 0
    });
    this.scene.start('Game');
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
    this.started = false;
    this.gameOver = false;
    this.debugVisible = DEBUG_DEFAULT;
    this.enemies = [];
    this.depthObjects = [];
    this.lastAttack = -999;
    this.lastStep = 0;
    this.aimAngle = 0;
    this.facing = 'down';
  }

  create() {
    window.__emberValeScene = this;
    this.sound.pauseOnBlur = false;
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBackgroundColor('#07100e');
    this.areaIndex = 0;
    this.area = AREAS[this.areaIndex];
    this.mapImage = this.add.image(0, 0, this.area.mapKey).setOrigin(0).setDepth(0);
    this.debugLayer = this.add.graphics().setDepth(99999).setVisible(this.debugVisible);
    this.solids = this.physics.add.staticGroup();
    this.transitionZones = this.physics.add.staticGroup();
    this.area.blockers.forEach((rect) => this.addBlocker(rect));
    this.area.depthAnchors.forEach((anchor) => this.addDepthAnchor(anchor));
    this.addExitZone();
    this.createEntities();
    this.createInput();
    this.updateHud();
    hud.start.addEventListener('click', () => this.startGame(), { once: true });
    hud.restart.addEventListener('click', () => window.location.reload(), { once: true });
  }

  startGame() {
    this.started = true;
    hud.title.classList.add('hidden');
    hud.hud.classList.add('visible');
    this.sound.play('sfx-ui', { volume: 0.35 });
    this.music = this.sound.add('music-theme', { loop: true, volume: 0.22 });
    this.music.play();
    this.showPrompt('The gate road is dangerous. Stay on the path and strike with the mouse.', 1800);
  }

  addBlocker(rect) {
    const zone = this.add.zone(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h);
    this.physics.add.existing(zone, true);
    zone.name = rect.name;
    this.solids.add(zone);
    this.debugLayer.lineStyle(2, 0xff3355, 0.72).strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  addDepthAnchor(anchor) {
    const object = this.add.zone(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2, anchor.w, anchor.h)
      .setDepth(anchor.depthY);
    object.depthY = anchor.depthY;
    this.depthObjects.push(object);
  }

  addExitZone() {
    if (!this.area.exit) return;
    const exit = this.area.exit;
    const zone = this.add.zone(exit.x + exit.w / 2, exit.y + exit.h / 2, exit.w, exit.h);
    this.physics.add.existing(zone, true);
    zone.exit = exit;
    this.transitionZones.add(zone);
    this.debugLayer.lineStyle(2, 0x61d6ff, 0.75).strokeRect(exit.x, exit.y, exit.w, exit.h);
  }

  createEntities() {
    this.player = this.physics.add.sprite(this.area.spawn.x, this.area.spawn.y, 'heroIdle')
      .setTexture('warrior', warriorFrame('down', 'idle', 0))
      .setScale(1.42)
      .setTint(PLAYER_BASE_TINT)
      .setDepth(this.area.spawn.y + 16)
      .setCollideWorldBounds(true);
    this.player.hp = PLAYER.maxHp;
    this.player.body.setSize(20, 30).setOffset(22, 30);
    this.player.shadow = this.addShadow(this.player.x, this.player.y + 24, 42, 12, 0.32);

    if (this.area.npc) {
      this.npc = this.physics.add.sprite(this.area.npc.x, this.area.npc.y, 'ranger')
        .setScale(0.17)
        .setDepth(this.area.npc.y + 16);
      this.npc.body.setSize(32, 36).setOffset(48, 76).setImmovable(true);
      this.npc.shadow = this.addShadow(this.npc.x, this.npc.y + 23, 32, 10, 0.28);
    } else {
      this.npc = null;
    }

    this.enemyGroup = this.physics.add.group();
    this.area.enemies.forEach((enemy) => this.spawnEnemy(enemy));

    this.physics.add.collider(this.player, this.solids);
    if (this.npc) this.physics.add.collider(this.player, this.npc);
    this.physics.add.collider(this.player, this.enemyGroup);
    this.physics.add.collider(this.enemyGroup, this.solids);
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.18);
    this.physics.add.overlap(this.player, this.transitionZones, (_player, zone) => this.transitionArea(zone.exit));
  }

  spawnEnemy(data) {
    const isBoss = data.kind === 'boss';
    const enemy = this.physics.add.sprite(data.x, data.y, isBoss ? 'skeleton' : 'goblin')
      .setScale(isBoss ? 0.29 : 0.23)
      .setDepth(data.y + 16);
    enemy.kind = data.kind;
    enemy.maxHp = isBoss ? 12 : 4;
    enemy.hp = enemy.maxHp;
    enemy.damage = isBoss ? 2 : 1;
    enemy.speed = isBoss ? 80 : 105;
    enemy.detectRange = isBoss ? 420 : 330;
    enemy.attackRange = isBoss ? 62 : 44;
    enemy.attackCooldown = isBoss ? 920 : 740;
    enemy.lastAttack = -999;
    enemy.patrol = data.patrol.map((point) => new Phaser.Math.Vector2(point.x, point.y));
    enemy.patrolIndex = 0;
    enemy.state = 'patrol';
    enemy.visualKeys = isBoss
      ? { idle: 'skeleton', walk: 'skeletonWalk', attack: 'skeletonAttack', hurt: 'skeletonHit' }
      : { idle: 'goblin', walk: 'goblinWalk', attack: 'goblinAttack', hurt: 'goblinHit' };
    enemy.body.setSize(34, 38).setOffset(47, 75);
    enemy.shadow = this.addShadow(enemy.x, enemy.y + 24, isBoss ? 58 : 44, isBoss ? 16 : 12, 0.32);
    enemy.bar = this.makeHealthBar(enemy, isBoss ? 78 : 48);
    this.enemies.push(enemy);
    this.enemyGroup.add(enemy);
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up2: Phaser.Input.Keyboard.KeyCodes.UP,
      down2: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      debug: Phaser.Input.Keyboard.KeyCodes.F3
    });
    this.input.on('pointermove', (pointer) => this.updateAim(pointer));
    this.input.on('pointerdown', (pointer) => {
      if (!this.started) return;
      this.updateAim(pointer);
      this.swordAttack();
    });
    window.addEventListener('keydown', (event) => {
      if (event.code === 'F3') {
        event.preventDefault();
        this.toggleDebug();
      }
      if (event.code === 'KeyE' && !event.repeat) {
        event.preventDefault();
        this.tryInteract();
      }
    });
  }

  update(time) {
    if (!this.started || this.gameOver) return;
    this.updatePlayer(time);
    this.updateEnemies(time);
    this.updateDepths();
    this.updateHud();
  }

  toggleDebug() {
    this.debugVisible = !this.debugVisible;
    this.debugLayer.setVisible(this.debugVisible);
  }

  updatePlayer(time) {
    if (this.attackLockedUntil && time < this.attackLockedUntil) {
      this.player.setVelocity(0, 0);
      this.player.shadow.setPosition(this.player.x, this.player.y + 24);
      return;
    }
    const move = new Phaser.Math.Vector2(
      Number(this.keys.right.isDown || this.keys.right2.isDown) - Number(this.keys.left.isDown || this.keys.left2.isDown),
      Number(this.keys.down.isDown || this.keys.down2.isDown) - Number(this.keys.up.isDown || this.keys.up2.isDown)
    );
    if (move.lengthSq() > 0) {
      move.normalize();
      this.facing = vectorToFacing(move.x, move.y);
    }
    this.player.setVelocity(move.x * PLAYER.speed, move.y * PLAYER.speed);
    const animKey = `${move.lengthSq() > 0 ? 'walk' : 'idle'}-${this.facing}`;
    if (this.player.anims.currentAnim?.key !== animKey) this.player.play(animKey, true);
    this.player.shadow.setPosition(this.player.x, this.player.y + 24);
    if (move.lengthSq() > 0 && time - this.lastStep > 360) {
      this.lastStep = time;
      this.sound.play('sfx-step', { volume: 0.07, rate: 0.9 + Math.random() * 0.12 });
    }
  }

  updateAim(pointer) {
    const world = pointer.positionToCamera(this.cameras.main);
    this.aimAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, world.x, world.y);
    this.facing = angleToFacing(this.aimAngle);
    this.player?.setFlipX(this.facing === 'left');
  }

  swordAttack() {
    const now = this.time.now;
    if (now - this.lastAttack < PLAYER.attackCooldown) return;
    this.lastAttack = now;
    this.attackLockedUntil = now + 330;
    this.player.play(`attack-${this.facing}`, true);
    this.sound.play('sfx-sword', { volume: 0.32, rate: 0.95 + Math.random() * 0.12 });

    const origin = new Phaser.Math.Vector2(this.player.x, this.player.y - 6);
    const center = new Phaser.Math.Vector2(origin.x + Math.cos(this.aimAngle) * 46, origin.y + Math.sin(this.aimAngle) * 46);
    this.time.delayedCall(95, () => {
      const slash = this.add.sprite(center.x, center.y, 'slash')
        .setScale(1.22)
        .setTint(0xffd89a)
        .setRotation(this.aimAngle)
        .setDepth(this.player.y + 70)
        .play('slash-swing');
      slash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => slash.destroy());
      if (this.debugVisible) {
        const hitbox = this.add.ellipse(center.x, center.y, 92, 36).setStrokeStyle(2, 0xfff06a, 0.85).setRotation(this.aimAngle).setDepth(99998);
        this.time.delayedCall(120, () => hitbox.destroy());
      }
      this.enemies.forEach((enemy) => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(origin.x, origin.y, enemy.x, enemy.y);
        const angle = Phaser.Math.Angle.Between(origin.x, origin.y, enemy.x, enemy.y);
        const diff = Math.abs(Phaser.Math.Angle.Wrap(angle - this.aimAngle));
        if (dist <= PLAYER.attackRange && diff <= PLAYER.attackArc) this.damageEnemy(enemy, 1.5, angle);
      });
    });
  }

  updateEnemies(time) {
    this.enemies.forEach((enemy) => {
      if (!enemy.active) return;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      enemy.state = distance < enemy.detectRange ? (distance <= enemy.attackRange ? 'attack' : 'chase') : 'patrol';
      if (enemy.state === 'patrol') {
        const target = enemy.patrol[enemy.patrolIndex];
        moveToward(enemy, target.x, target.y, enemy.speed * 0.48);
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y) < 10) enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrol.length;
      } else if (enemy.state === 'chase') {
        moveToward(enemy, this.player.x, this.player.y, enemy.speed);
      } else {
        enemy.setVelocity(0, 0);
        if (time - enemy.lastAttack > enemy.attackCooldown) {
          enemy.lastAttack = time;
          this.enemyAttack(enemy);
        }
      }
      if (enemy.body.velocity.x !== 0) enemy.setFlipX(enemy.body.velocity.x < 0);
      this.updateEnemyVisual(enemy, time);
      enemy.shadow.setPosition(enemy.x, enemy.y + 23);
      enemy.bar.setPosition(enemy.x, enemy.y - (enemy.kind === 'boss' ? 44 : 38));
    });
  }

  updateEnemyVisual(enemy, time) {
    let key = enemy.visualKeys.idle;
    if (enemy.hitUntil && time < enemy.hitUntil) key = enemy.visualKeys.hurt;
    else if (enemy.attackUntil && time < enemy.attackUntil) key = enemy.visualKeys.attack;
    else if (enemy.body.velocity.lengthSq() > 4) key = enemy.visualKeys.walk;
    if (enemy.texture.key !== key) enemy.setTexture(key);
    const movingLean = enemy.body.velocity.lengthSq() > 4 ? Math.sin(time / 115 + enemy.x * 0.02) * 1.8 : 0;
    enemy.setAngle(movingLean);
  }

  enemyAttack(enemy) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    enemy.attackUntil = this.time.now + 220;
    const hit = this.add.ellipse(enemy.x + Math.cos(angle) * 28, enemy.y + Math.sin(angle) * 22, 52, 28, 0xe15743, 0.3)
      .setRotation(angle)
      .setDepth(enemy.y + 60);
    this.tweens.add({ targets: hit, alpha: 0, duration: 170, onComplete: () => hit.destroy() });
    if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <= enemy.attackRange + 18) this.hurtPlayer(enemy.damage);
  }

  damageEnemy(enemy, amount, angle) {
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.hitUntil = this.time.now + 160;
    enemy.setTexture(enemy.visualKeys.hurt);
    enemy.setTint(0xffefb0);
    enemy.bar.fill.displayWidth = enemy.bar.width * (enemy.hp / enemy.maxHp);
    this.time.delayedCall(100, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
    enemy.setVelocity(Math.cos(angle) * 105, Math.sin(angle) * 85);
    this.addHitBurst(enemy.x, enemy.y - 15, enemy.kind === 'boss' ? 0xffd470 : 0xf1785b);
    this.sound.play(enemy.hp <= 0 ? 'sfx-die' : 'sfx-hurt', { volume: enemy.hp <= 0 ? 0.32 : 0.22 });
    if (enemy.hp <= 0) {
      enemy.shadow.destroy();
      enemy.bar.destroy();
      enemy.disableBody(true, true);
      this.cameras.main.shake(enemy.kind === 'boss' ? 180 : 90, enemy.kind === 'boss' ? 0.004 : 0.002);
      if (enemy.kind === 'boss') {
        hud.quest.textContent = 'The Grave Knight has fallen. Open the ember chest by the gate.';
        this.showPrompt('The ember chest unlocks.', 1600);
      }
    }
  }

  hurtPlayer(amount) {
    if (this.time.now - (this.player.lastHurt || -9999) < 650) return;
    this.player.lastHurt = this.time.now;
    this.player.hp = Math.max(0, this.player.hp - amount);
    this.player.setTint(0xff6868);
    this.cameras.main.shake(130, 0.004);
    this.sound.play('sfx-clash', { volume: 0.28 });
    this.time.delayedCall(140, () => this.player.setTint(PLAYER_BASE_TINT));
    if (this.player.hp <= 0) this.endGame(false);
  }

  tryInteract() {
    if (!this.started || this.gameOver) return;
    if (this.npc && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < 80) {
      this.showPrompt(this.area.npc.line, 2600);
      this.sound.play('sfx-ui', { volume: 0.28 });
      return;
    }
    if (this.area.chest && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.area.chest.x, this.area.chest.y) < 90) {
      const bossAlive = this.enemies.some((enemy) => enemy.active && enemy.kind === 'boss');
      if (bossAlive) this.showPrompt('The chest is sealed while the Grave Knight stands.', 1500);
      else this.endGame(true);
    }
  }

  transitionArea(exit) {
    if (this.transitioning || !exit || this.areaIndex === exit.target) return;
    this.transitioning = true;
    this.showPrompt(exit.prompt, 700);
    this.cameras.main.fadeOut(300, 6, 8, 10);
    this.time.delayedCall(320, () => {
      this.loadArea(exit.target, exit.targetSpawn);
      this.cameras.main.fadeIn(320, 6, 8, 10);
      this.transitioning = false;
    });
  }

  loadArea(index, spawn) {
    this.areaIndex = index;
    this.area = AREAS[index];
    this.mapImage.setTexture(this.area.mapKey);
    hud.area.textContent = this.area.name;
    hud.quest.textContent = index === 0
      ? 'Talk to the ranger, clear the road, then enter the ruined gate.'
      : 'Explore the Moonwell Ruins, defeat the Grave Knight, then open the ember chest.';
    this.debugLayer.clear();
    this.solids.clear(true, true);
    this.transitionZones.clear(true, true);
    this.depthObjects.forEach((object) => object.destroy());
    this.depthObjects = [];
    this.enemies.forEach((enemy) => {
      enemy.shadow?.destroy();
      enemy.bar?.destroy();
      enemy.destroy();
    });
    this.enemies = [];
    this.enemyGroup.clear(true, true);
    if (this.npc) {
      this.npc.shadow?.destroy();
      this.npc.destroy();
      this.npc = null;
    }
    this.area.blockers.forEach((rect) => this.addBlocker(rect));
    this.area.depthAnchors.forEach((anchor) => this.addDepthAnchor(anchor));
    this.addExitZone();
    if (this.area.npc) {
      this.npc = this.physics.add.sprite(this.area.npc.x, this.area.npc.y, 'ranger')
        .setScale(0.17)
        .setDepth(this.area.npc.y + 16);
      this.npc.body.setSize(32, 36).setOffset(48, 76).setImmovable(true);
      this.npc.shadow = this.addShadow(this.npc.x, this.npc.y + 23, 32, 10, 0.28);
      this.physics.add.collider(this.player, this.npc);
    }
    this.area.enemies.forEach((enemy) => this.spawnEnemy(enemy));
    this.physics.add.collider(this.enemyGroup, this.solids);
    this.physics.add.collider(this.player, this.enemyGroup);
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);
    this.physics.add.overlap(this.player, this.transitionZones, (_player, zone) => this.transitionArea(zone.exit));
    this.player.setPosition(spawn.x, spawn.y);
    this.player.body.updateFromGameObject();
    this.cameras.main.centerOn(spawn.x, spawn.y);
    this.showPrompt(this.area.name, 1400);
  }

  updateDepths() {
    this.player.setDepth(this.player.y + 20);
    if (this.npc) this.npc.setDepth(this.npc.y + 20);
    this.enemies.forEach((enemy) => {
      if (enemy.active) enemy.setDepth(enemy.y + 20);
    });
  }

  makeHealthBar(target, width) {
    const group = this.add.container(target.x, target.y - 38).setDepth(20000);
    const back = this.add.rectangle(0, 0, width + 4, 7, 0x1c1210, 0.9);
    const fill = this.add.rectangle(-width / 2, 0, width, 5, target.kind === 'boss' ? 0xc12f2a : 0xe45a3c, 1).setOrigin(0, 0.5);
    group.add([back, fill]);
    group.fill = fill;
    group.width = width;
    return group;
  }

  addShadow(x, y, w, h, alpha) {
    return this.add.ellipse(x, y, w, h, 0x050403, alpha).setDepth(y - 2);
  }

  addHitBurst(x, y, color) {
    for (let i = 0; i < 5; i += 1) {
      const dot = this.add.circle(x, y, 3, color, 0.86).setDepth(y + 80);
      this.tweens.add({
        targets: dot,
        x: x + (Math.random() - 0.5) * 46,
        y: y + (Math.random() - 0.65) * 38,
        alpha: 0,
        duration: 240,
        onComplete: () => dot.destroy()
      });
    }
  }

  showPrompt(text, duration = 1400) {
    hud.prompt.textContent = text;
    hud.prompt.classList.add('visible');
    clearTimeout(this.promptTimer);
    this.promptTimer = setTimeout(() => hud.prompt.classList.remove('visible'), duration);
  }

  updateHud() {
    hud.health.style.width = `${Math.max(0, (this.player?.hp ?? PLAYER.maxHp) / PLAYER.maxHp) * 100}%`;
    const boss = this.enemies.find((enemy) => enemy.kind === 'boss' && enemy.active);
    hud.bossHud.classList.toggle('visible', Boolean(boss && this.started));
    if (boss) hud.bossFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
  }

  endGame(victory) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.player.setVelocity(0, 0);
    this.enemyGroup.children.each((enemy) => enemy.setVelocity(0, 0));
    this.music?.setVolume(victory ? 0.12 : 0);
    this.sound.play(victory ? 'sfx-victory' : 'sfx-defeat', { volume: 0.5 });
    hud.endingEyebrow.textContent = victory ? 'Victory' : 'Defeat';
    hud.endingTitle.textContent = victory ? 'The Road Is Safe' : 'The Road Falls';
    hud.endingText.textContent = victory
      ? 'The ember chest opens and Greenhollow lanterns burn through the mist.'
      : 'The Grave Knight breaks the line. Restart and use spacing, aim, and the road.';
    hud.ending.classList.add('visible');
  }
}

function moveToward(sprite, x, y, speed) {
  const vector = new Phaser.Math.Vector2(x - sprite.x, y - sprite.y);
  if (vector.lengthSq() > 0) vector.normalize();
  sprite.setVelocity(vector.x * speed, vector.y * speed);
}

function vectorToFacing(x, y) {
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}

function angleToFacing(angle) {
  const deg = Phaser.Math.RadToDeg(Phaser.Math.Angle.Wrap(angle));
  if (deg > -45 && deg <= 45) return 'right';
  if (deg > 45 && deg <= 135) return 'down';
  if (deg <= -45 && deg > -135) return 'up';
  return 'left';
}

function createChromaFrames(scene, rawKey, cells, rows, cols) {
  const image = scene.textures.get(rawKey).getSourceImage();
  const cellW = Math.floor(image.width / cols);
  const cellH = Math.floor(image.height / rows);
  Object.entries(cells).forEach(([name, [row, col]]) => {
    const canvas = scene.textures.createCanvas(name, cellW, cellH);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, cellW, cellH);
    ctx.drawImage(image, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
    keyOutMagenta(ctx, cellW, cellH);
    canvas.refresh();
  });
}

function keyOutMagenta(ctx, w, h) {
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 70 && b > 70 && g < 125 && r - g > 24 && b - g > 22 && Math.abs(r - b) < 100) data[i + 3] = 0;
  }
  ctx.putImageData(image, 0, 0);
}

function warriorFrame(direction, action, index) {
  const rows = {
    right: { idle: 1, walk: 3, attack: 5 },
    down: { idle: 7, walk: 9, attack: 11 },
    left: { idle: 13, walk: 15, attack: 17 },
    up: { idle: 19, walk: 21, attack: 23 }
  };
  return rows[direction][action] * 14 + index;
}

function createWarriorAnimations(scene) {
  ['right', 'down', 'left', 'up'].forEach((direction) => {
    scene.anims.create({
      key: `idle-${direction}`,
      frames: scene.anims.generateFrameNumbers('warrior', {
        start: warriorFrame(direction, 'idle', 0),
        end: warriorFrame(direction, 'idle', 3)
      }),
      frameRate: 5,
      repeat: -1
    });
    scene.anims.create({
      key: `walk-${direction}`,
      frames: scene.anims.generateFrameNumbers('warrior', {
        start: warriorFrame(direction, 'walk', 0),
        end: warriorFrame(direction, 'walk', 7)
      }),
      frameRate: 10,
      repeat: -1
    });
    scene.anims.create({
      key: `attack-${direction}`,
      frames: scene.anims.generateFrameNumbers('warrior', {
        start: warriorFrame(direction, 'attack', 0),
        end: warriorFrame(direction, 'attack', 5)
      }),
      frameRate: 18,
      repeat: 0
    });
  });
}

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game-root',
  width: 1280,
  height: 720,
  backgroundColor: '#07100e',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GameScene]
});
