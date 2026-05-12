import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 5199;
const baseUrl = `http://127.0.0.1:${port}/`;
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    if (output.includes('Local:') || output.includes(`127.0.0.1:${port}`)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Vite did not start. Output:\n${output}`);
}

async function run() {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__emberValeScene), null, { timeout: 10000 });
  await page.click('#startButton');
  await page.waitForTimeout(350);
  await page.click('canvas', { position: { x: 24, y: 24 } });
  await page.keyboard.press('F3');
  await page.waitForTimeout(80);
  const debugOn = await page.evaluate(() => window.__emberValeScene.debugVisible);
  await page.keyboard.press('F3');
  await page.waitForTimeout(80);
  const debugOff = await page.evaluate(() => window.__emberValeScene.debugVisible);
  await page.keyboard.down('d');
  await page.waitForTimeout(260);
  const realKeyboardWalkAnim = await page.evaluate(() => window.__emberValeScene.player.anims.currentAnim?.key);
  await page.keyboard.up('d');
  await page.waitForTimeout(140);

  const setupReport = await page.evaluate(async () => {
    const scene = window.__emberValeScene;
    const wait = (ms) => new Promise((resolve) => scene.time.delayedCall(ms, resolve));
    const key = (code, down) => {
      window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
        code,
        key: code.replace('Key', '').toLowerCase(),
        bubbles: true
      }));
    };
    const moveTest = async (name, start, code, ms, forbidden) => {
      scene.player.setPosition(start.x, start.y);
      scene.player.body.updateFromGameObject();
      key(code, true);
      await wait(ms);
      key(code, false);
      await wait(100);
      const player = { x: Math.round(scene.player.x), y: Math.round(scene.player.y) };
      const inside = player.x >= forbidden.x
        && player.x <= forbidden.x + forbidden.w
        && player.y >= forbidden.y
        && player.y <= forbidden.y + forbidden.h;
      return { name, player, blocked: !inside };
    };

    const overworldCollisions = [
      await moveTest('tavern building blocks', { x: 880, y: 430 }, 'KeyW', 1000, { x: 737, y: 120, w: 300, h: 288 }),
      await moveTest('wagon blocks', { x: 1105, y: 570 }, 'KeyD', 900, { x: 1122, y: 520, w: 170, h: 95 }),
      await moveTest('tent camp blocks', { x: 1240, y: 720 }, 'KeyD', 1000, { x: 1310, y: 642, w: 244, h: 182 }),
      await moveTest('south edge blocks', { x: 850, y: 860 }, 'KeyS', 900, { x: 0, y: 884, w: 1672, h: 57 }),
      await moveTest('east cliff blocks', { x: 1425, y: 480 }, 'KeyD', 1000, { x: 1450, y: 332, w: 222, h: 320 })
    ];

    const goblin = scene.enemies.find((enemy) => enemy.kind === 'goblin' && enemy.active);
    scene.player.setPosition(goblin.x - 72, goblin.y);
    scene.player.body.updateFromGameObject();
    scene.cameras.main.centerOn(scene.player.x, scene.player.y);
    await wait(80);
    const camera = scene.cameras.main;
    const nearClick = {
      x: Math.round((goblin.x - camera.scrollX) * camera.zoom),
      y: Math.round((goblin.y - camera.scrollY) * camera.zoom)
    };

    return {
      started: scene.started,
      areaName: scene.area.name,
      mapTexture: scene.mapImage.texture.key,
      debugVisible: scene.debugVisible,
      audioState: scene.sound.context?.state || 'unknown',
      playerScale: scene.player.scaleX,
      playerBody: { w: scene.player.body.width, h: scene.player.body.height },
      blockerCount: scene.solids.children.entries.length,
      overworldCollisions,
      beforeClickHp: goblin.hp,
      nearClick
    };
  });

  await page.click('canvas', { position: setupReport.nearClick });
  await page.waitForTimeout(280);

  const combatAndProgression = await page.evaluate(async () => {
    const scene = window.__emberValeScene;
    const wait = (ms) => new Promise((resolve) => scene.time.delayedCall(ms, resolve));
    const goblin = scene.enemies.find((enemy) => enemy.kind === 'goblin' && enemy.active);
    const afterClickHp = goblin.hp;
    const facingAfterClick = scene.facing;
    const attackAnim = scene.player.anims.currentAnim?.key;

    const beforeFarHp = goblin.hp;
    scene.player.setPosition(goblin.x - 230, goblin.y);
    scene.player.body.updateFromGameObject();
    scene.aimAngle = 0;
    scene.facing = 'right';
    scene.lastAttack = -999;
    scene.swordAttack();
    await wait(170);
    const afterFarHp = goblin.hp;

    scene.player.setPosition(1415, 188);
    scene.player.body.updateFromGameObject();
    await wait(760);
    const transitioned = {
      areaIndex: scene.areaIndex,
      areaName: scene.area.name,
      mapTexture: scene.mapImage.texture.key,
      player: { x: Math.round(scene.player.x), y: Math.round(scene.player.y) },
      enemyKinds: scene.enemies.filter((enemy) => enemy.active).map((enemy) => enemy.kind),
      blockerCount: scene.solids.children.entries.length,
      hudArea: document.querySelector('#areaText').textContent
    };

    const moveTest = async (name, start, code, ms, forbidden) => {
      const key = (keyboardCode, down) => {
        window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
          code: keyboardCode,
          key: keyboardCode.replace('Key', '').toLowerCase(),
          bubbles: true
        }));
      };
      scene.player.setPosition(start.x, start.y);
      scene.player.body.updateFromGameObject();
      key(code, true);
      await wait(ms);
      key(code, false);
      await wait(100);
      const player = { x: Math.round(scene.player.x), y: Math.round(scene.player.y) };
      const inside = player.x >= forbidden.x
        && player.x <= forbidden.x + forbidden.w
        && player.y >= forbidden.y
        && player.y <= forbidden.y + forbidden.h;
      return { name, player, blocked: !inside };
    };

    const dungeonCollisions = [
      await moveTest('left temple wall blocks', { x: 610, y: 230 }, 'KeyA', 950, { x: 108, y: 70, w: 490, h: 310 }),
      await moveTest('top water blocks', { x: 800, y: 270 }, 'KeyW', 900, { x: 660, y: 70, w: 395, h: 186 }),
      await moveTest('right water channel blocks', { x: 1180, y: 460 }, 'KeyD', 950, { x: 1220, y: 390, w: 360, h: 160 }),
      await moveTest('bottom waterfall blocks', { x: 1130, y: 790 }, 'KeyD', 1000, { x: 1190, y: 720, w: 210, h: 170 }),
      await moveTest('south chasm blocks', { x: 880, y: 845 }, 'KeyS', 700, { x: 0, y: 872, w: 1672, h: 69 })
    ];

    const boss = scene.enemies.find((enemy) => enemy.kind === 'boss' && enemy.active);
    const bossStart = { x: Math.round(boss.x), y: Math.round(boss.y), hp: boss.hp, state: boss.state };
    scene.player.setPosition(boss.x - 190, boss.y + 8);
    scene.player.body.updateFromGameObject();
    await wait(1250);
    const bossChase = { x: Math.round(boss.x), y: Math.round(boss.y), state: boss.state, playerHp: scene.player.hp };
    scene.player.setPosition(boss.x - 42, boss.y);
    scene.player.body.updateFromGameObject();
    await wait(1250);
    const bossAttack = { state: boss.state, playerHp: scene.player.hp };
    scene.damageEnemy(boss, 99, 0);
    await wait(140);
    scene.player.setPosition(scene.area.chest.x, scene.area.chest.y + 60);
    scene.player.body.updateFromGameObject();

    return {
      afterClickHp,
      facingAfterClick,
      attackAnim,
      beforeFarHp,
      afterFarHp,
      transitioned,
      dungeonCollisions,
      bossStart,
      bossChase,
      bossAttack
    };
  });

  await page.keyboard.press('e');
  await page.waitForTimeout(250);
  const victory = await page.evaluate(() => {
    const scene = window.__emberValeScene;
    return {
      gameOver: scene.gameOver,
      title: document.querySelector('#endingTitle').textContent,
      endingVisible: document.querySelector('#ending').classList.contains('visible')
    };
  });

  await browser.close();

  assert(pageErrors.length === 0, `Console/page errors:\n${pageErrors.join('\n')}`);
  assert(setupReport.started, 'Game did not start');
  assert(setupReport.areaName === 'Lantern Road' && setupReport.mapTexture === 'world-map', 'Initial area/map mismatch');
  assert(setupReport.debugVisible === false, 'Debug overlay should default off');
  assert(debugOn === true && debugOff === false, 'F3 debug toggle failed');
  assert(setupReport.audioState === 'running', `Audio context should be running after interaction, got ${setupReport.audioState}`);
  assert(setupReport.playerScale >= 1.35, `Player scale audit failed: ${setupReport.playerScale}`);
  assert(setupReport.playerBody.h >= 28, `Player collision body too small: ${JSON.stringify(setupReport.playerBody)}`);
  assert(realKeyboardWalkAnim === 'walk-right', `Player walk animation failed, got ${realKeyboardWalkAnim}`);
  assert(setupReport.blockerCount >= 18, `Expected overworld collision blockers, got ${setupReport.blockerCount}`);
  assert(setupReport.overworldCollisions.every((item) => item.blocked), `Overworld collision failed: ${JSON.stringify(setupReport.overworldCollisions)}`);
  assert(combatAndProgression.afterClickHp < setupReport.beforeClickHp, 'Real mouse click did not damage nearby enemy');
  assert(combatAndProgression.afterFarHp === combatAndProgression.beforeFarHp, 'Far sword attack damaged enemy outside range');
  assert(combatAndProgression.facingAfterClick === 'right', `Mouse-facing should point right in click test, got ${combatAndProgression.facingAfterClick}`);
  assert(combatAndProgression.attackAnim?.startsWith('attack-'), `Attack animation did not play, got ${combatAndProgression.attackAnim}`);
  assert(combatAndProgression.transitioned.areaIndex === 1, `Level transition failed: ${JSON.stringify(combatAndProgression.transitioned)}`);
  assert(combatAndProgression.transitioned.areaName === 'Moonwell Ruins', 'Dungeon area did not load');
  assert(combatAndProgression.transitioned.mapTexture === 'dungeon-map', 'Dungeon map texture did not load');
  assert(combatAndProgression.transitioned.hudArea === 'Moonwell Ruins', 'HUD area label did not update');
  assert(combatAndProgression.transitioned.enemyKinds.includes('boss'), 'Boss did not spawn in dungeon area');
  assert(combatAndProgression.dungeonCollisions.every((item) => item.blocked), `Dungeon collision failed: ${JSON.stringify(combatAndProgression.dungeonCollisions)}`);
  assert(combatAndProgression.bossChase.state === 'chase' || combatAndProgression.bossChase.state === 'attack', `Boss did not chase/engage: ${combatAndProgression.bossChase.state}`);
  assert(combatAndProgression.bossAttack.playerHp < combatAndProgression.bossChase.playerHp, 'Boss attack did not damage player');
  assert(victory.gameOver && victory.endingVisible && victory.title === 'The Road Is Safe', `Victory flow failed: ${JSON.stringify(victory)}`);

  console.log(JSON.stringify({ setupReport, combatAndProgression, victory, debug: { debugOn, debugOff } }, null, 2));
}

try {
  await run();
} finally {
  server.kill('SIGTERM');
}
