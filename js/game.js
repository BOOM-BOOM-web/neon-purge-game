const Game = {
  state: 'menu', time: 0, lastT: 0,
  player: null, enemies: [], enemyBullets: [], damageNumbers: [], pickups: [], bloodSplats: [],
  round: 1, kills: 0, totalKills: 0, coins: 0, highScore: parseInt(Storage.get('neonpurge_hs', '0')),
  roundTimer: 0, roundDuration: 30, spawnTimer: 0, isBossRound: false, bossAlive: false, roundClean: true,
  screenShake: 0, shakeX: 0, shakeY: 0, combo: 0, comboTimer: 0,
  weapons: {}, weaponCooldowns: {}, upgrades: { health:0, speed:0, firerate:0, damage:0, coins:0, dash:0 },
  freePullUsed: false, lotteryAnimating: false,
  
  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    requestAnimationFrame(this.loop.bind(this));
  },
  
  resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; },
  
  start() {
    this.state = 'playing';
    this.player = new Player();
    Camera.x = this.player.x - window.innerWidth/2; Camera.y = this.player.y - window.innerHeight/2;
    this.enemies = []; this.bloodSplats = []; this.pickups = [];
    this.round = 1; this.kills = 0; this.totalKills = 0; this.coins = 0;
    this.weapons = { pistol: 'common' }; this.upgrades = { health:0, speed:0, firerate:0, damage:0, coins:0, dash:0 };
    this.freePullUsed = false; Lottery.pityCount = 0;
    this.startRound();
  },
  
  startRound() {
    this.isBossRound = this.round % Config.round.bossEvery === 0;
    this.bossAlive = false; this.roundTimer = 0;
    this.roundDuration = Config.round.baseDuration + Math.floor(this.round / 3) * 5;
    this.spawnTimer = 1.0;
    this.roundClean = true; this.combo = 0;
    this.player.health = Math.min(this.player.maxHealth, this.player.health + Config.player.regenPerRound);
    document.getElementById('round-flash').style.opacity = '1';
    setTimeout(() => { document.getElementById('round-flash').style.opacity = '0'; }, 300);
    Sfx.roundStart();
  },
  
  endRound() {
    const bonus = 40 + this.round * 8 + (this.roundClean ? 20 : 0);
    this.coins += bonus;
    document.getElementById('round-bonus').textContent = bonus;
    this.state = 'lottery'; this.freePullUsed = false;
    UI.showLottery();
  },
  
  spawnEnemy(type, x, y) {
    const p = this.player;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(window.innerWidth, window.innerHeight) * 0.7;
    if (x === undefined) { x = p.x + Math.cos(angle) * dist; y = p.y + Math.sin(angle) * dist; }
    this.enemies.push(new Enemy(type, x, y));
  },
  
  updateSpawning(dt) {
    if (this.isBossRound) {
      if (!this.bossAlive && !this.enemies.some(e => e.isBoss)) {
        this.spawnEnemy('boss');
        this.bossAlive = true;
        document.getElementById('boss-bar-container').classList.remove('hidden');
        Sfx.legendary();
      }
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) { this.spawnTimer = 2.5; this.spawnEnemy(pick(['walker','runner'])); }
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.2, 0.8 - this.round * 0.04);
      const pool = ['walker'];
      if (this.round >= 2) pool.push('runner');
      if (this.round >= 4) pool.push('brute');
      if (this.round >= 6) pool.push('spitter');
      if (this.round >= 8) pool.push('bomber');
      const count = 3 + Math.floor(this.round / 2);
      for (let i = 0; i < count; i++) this.spawnEnemy(pick(pool));
    }
  },
  
  fireWeapons(dt) {
    const p = this.player;
    for (const wkey in this.weapons) {
      const w = WEAPONS[wkey];
      const rarMult = RARITIES[this.weapons[wkey]].mult;
      const effFireRate = w.fireRate / (1 + this.upgrades.firerate * 0.15) / rarMult;
      this.weaponCooldowns[wkey] = (this.weaponCooldowns[wkey] || 0) - dt * 1000;
      if (this.weaponCooldowns[wkey] <= 0) {
        this.weaponCooldowns[wkey] = effFireRate;
        this.fireWeapon(wkey, p.angle);
      }
    }
  },
  
  fireWeapon(wkey, baseAngle) {
    const p = this.player, w = WEAPONS[wkey];
    const rarMult = RARITIES[this.weapons[wkey]].mult;
    const dmgMult = (1 + this.upgrades.damage * 0.20) * rarMult;
    Sfx.shoot();
    
    for (let i = 0; i < 4; i++) spawnParticle(p.x + Math.cos(baseAngle)*p.radius, p.y + Math.sin(baseAngle)*p.radius, Math.cos(baseAngle+rand(-0.5,0.5))*rand(50,150), Math.sin(baseAngle+rand(-0.5,0.5))*rand(50,150), 0.15, rand(3,6), w.color);
    
    if (wkey === 'lightning') {
      const targets = []; const available = this.enemies.filter(e => e.hp > 0); let prev = p;
      for (let i = 0; i < w.chain.count && available.length > 0; i++) {
        let closest = null, cd = w.chain.range;
        for (const e of available) { if (targets.includes(e)) continue; const d = dist(prev, e); if (d < cd) { cd = d; closest = e; } }
        if (!closest) break; targets.push(closest); prev = closest;
      }
      let prevPos = { x: p.x, y: p.y };
      for (const t of targets) {
        damageEnemy(t, w.damage * dmgMult, '#88ddff');
        for(let i=0; i<5; i++) spawnParticle(lerp(prevPos.x, t.x, Math.random()), lerp(prevPos.y, t.y, Math.random()), 0, 0, 0.2, rand(2,4), '#88ddff');
        prevPos = { x: t.x, y: t.y };
      }
      return;
    }
    
    const count = w.count + (this.weapons[wkey] === 'mythic' ? 2 : this.weapons[wkey] === 'legendary' ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * w.spread * 2;
      const angle = baseAngle + spread + (count > 1 ? (i / (count - 1) - 0.5) * w.spread * 1.5 : 0);
      const isCrit = Math.random() < 0.12;
      const dmg = w.damage * dmgMult * (isCrit ? 2 : 1);
      spawnBullet(p.x + Math.cos(angle)*p.radius, p.y + Math.sin(angle)*p.radius, angle, w.bulletSpeed, dmg, w.radius, w.color, w.pierce, w.bounce || 0, w.explosion, isCrit);
    }
  },
  
  createExplosion(x, y, r, dmg) {
    for (const e of this.enemies) { if (e.hp > 0 && distSq({x,y}, e) < r*r) damageEnemy(e, dmg, '#ffaa00'); }
    if (distSq({x,y}, this.player) < r*r && this.player.invuln <= 0) this.damagePlayer(dmg);
    for (let i = 0; i < 20; i++) { const a=rand(0,Math.PI*2), s=rand(100,250); spawnParticle(x, y, Math.cos(a)*s, Math.sin(a)*s, rand(0.3,0.6), rand(2,5), '#ffaa00'); }
    this.screenShake = Math.max(this.screenShake, 12);
  },
  
  killEnemy(e) {
    this.kills++; this.totalKills++; this.combo++; this.comboTimer = 2.5;
    const coinGain = Math.ceil(e.coins * (1 + this.upgrades.coins * 0.25));
    this.coins += coinGain;
    for (let i = 0; i < 3; i++) this.pickups.push({ x:e.x+rand(-15,15), y:e.y+rand(-15,15), vx:rand(-100,100), vy:rand(-100,100), value:Math.ceil(coinGain/3), life:8, radius:5 });
    const partCount = e.isBoss ? 80 : 15;
    for (let i = 0; i < partCount; i++) { const a=rand(0,Math.PI*2), s=rand(50,250); spawnParticle(e.x, e.y, Math.cos(a)*s, Math.sin(a)*s, rand(0.4,0.9), rand(2,6), e.color); }
    this.bloodSplats.push({ x:e.x, y:e.y, r:e.radius*1.5, c:e.color, a:0.3 });
    if (this.bloodSplats.length > 50) this.bloodSplats.shift();
    this.screenShake = Math.max(this.screenShake, e.isBoss ? 35 : 5);
    Sfx.kill();
    if (e.isBoss) { this.bossAlive = false; document.getElementById('boss-bar-container').classList.add('hidden'); setTimeout(() => { if (this.state === 'playing') this.endRound(); }, 800); }
  },
  
  damagePlayer(dmg) {
    this.player.health -= dmg; this.player.invuln = 0.3; this.roundClean = false; this.combo = 0;
    this.screenShake = Math.max(this.screenShake, 8);
    document.getElementById('damage-flash').style.opacity = '1';
    setTimeout(() => { document.getElementById('damage-flash').style.opacity = '0'; }, 150);
    Sfx.hurt();
    if (this.player.health <= 0) { this.player.health = 0; this.gameOver(); }
  },
  
  gameOver() {
    this.state = 'gameover'; Sfx.gameOver();
    if (this.coins > this.highScore) { this.highScore = this.coins; Storage.set('neonpurge_hs', this.coins); }
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('boss-bar-container').classList.add('hidden');
    document.getElementById('final-rounds').textContent = this.round;
    document.getElementById('final-kills').textContent = this.totalKills;
    document.getElementById('final-coins').textContent = this.coins;
    document.getElementById('new-record').innerHTML = this.coins >= this.highScore ? '<span class="text-yellow-400 font-display font-bold tracking-wider anim-glowPulse">★ NEW RECORD ★</span>' : '';
    document.getElementById('gameover-screen').classList.remove('hidden');
  },
  
  update(dt) {
    this.time += dt;
    if (this.state !== 'playing') return;
    
    Camera.follow(this.player, dt);
    this.player.update(dt);
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt);
      if (e.hp <= 0) { this.killEnemy(e); this.enemies.splice(i, 1); continue; }
      if (e.isBoss) document.getElementById('boss-bar-fill').style.width = (e.hp / e.maxHp * 100) + '%';
    }
    
    updateBullets(dt);
    updateParticles(dt);
    
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      if (b.life <= 0) { this.enemyBullets.splice(i,1); continue; }
      if (distSq(b, this.player) < (b.radius+this.player.radius)**2 && this.player.invuln <= 0) {
        this.damagePlayer(b.damage); this.enemyBullets.splice(i, 1);
      }
    }
    
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]; p.life -= dt;
      const dx = this.player.x - p.x, dy = this.player.y - p.y; const d = Math.hypot(dx, dy);
      if (d < 150) { const pull = 400 * (1 - d/150); p.vx += (dx/d)*pull*dt*10; p.vy += (dy/d)*pull*dt*10; }
      p.vx *= 0.92; p.vy *= 0.92; p.x += p.vx*dt; p.y += p.vy*dt;
      if (d < this.player.radius + p.radius) { this.coins += p.value; Sfx.coin(); this.pickups.splice(i,1); continue; }
      if (p.life <= 0) this.pickups.splice(i,1);
    }
    
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i]; d.y -= 40*dt; d.life -= dt;
      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }
    
    if (this.combo > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    this.updateSpawning(dt);
    
    if (!this.isBossRound) {
      this.roundTimer += dt;
      if (this.roundTimer >= this.roundDuration) this.endRound();
    }
    UI.updateHUD();
  },
  
  render() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    
    if (this.screenShake > 0) {
      this.shakeX = rand(-this.screenShake, this.screenShake) * 0.5;
      this.shakeY = rand(-this.screenShake, this.screenShake) * 0.5;
      this.screenShake *= 0.85;
      if (this.screenShake < 0.5) this.screenShake = 0;
    } else { this.shakeX = 0; this.shakeY = 0; }
    
    ctx.fillStyle = '#030308';
    ctx.fillRect(0, 0, W, H);
    if (this.state === 'menu') return;
    
    ctx.save();
    ctx.translate(-Camera.x + this.shakeX, -Camera.y + this.shakeY);
    
    // Infinite Grid
    ctx.strokeStyle = 'rgba(0,40,80,0.2)'; ctx.lineWidth = 1;
    const grid = 100;
    const sx = Math.floor(Camera.x / grid) * grid;
    const sy = Math.floor(Camera.y / grid) * grid;
    for (let x = sx; x < Camera.x + W + grid; x += grid) { ctx.beginPath(); ctx.moveTo(x, Camera.y - grid); ctx.lineTo(x, Camera.y + H + grid); ctx.stroke(); }
    for (let y = sy; y < Camera.y + H + grid; y += grid) { ctx.beginPath(); ctx.moveTo(Camera.x - grid, y); ctx.lineTo(Camera.x + W + grid, y); ctx.stroke(); }
    
    // Blood Splats
    for (const s of this.bloodSplats) { ctx.globalAlpha = s.a; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1;
    
    // Additive blending for glows
    ctx.globalCompositeOperation = 'lighter';
    
    for (const p of this.pickups) {
      const pulse = 1 + Math.sin(this.time * 8) * 0.2;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI*2); ctx.fill();
    }
    
    for (const b of bulletPool.active) {
      if (b.trail.length > 1) {
        ctx.strokeStyle = b.color; ctx.globalAlpha = 0.3; ctx.lineWidth = b.r * 1.5;
        ctx.beginPath(); ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (const t of b.trail) ctx.lineTo(t.x, t.y);
        ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
    }
    
    for (const b of this.enemyBullets) {
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
    }
    
    for (const part of particlePool.active) {
      const a = part.life / part.maxLife;
      ctx.globalAlpha = a; ctx.fillStyle = part.color;
      ctx.beginPath(); ctx.arc(part.x, part.y, part.r * a, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over'; // Reset
    
    // Draw distinct solid shapes
    for (const e of this.enemies) e.render(ctx);
    this.player.render(ctx);
    
    // Damage Numbers
    for (const d of this.damageNumbers) {
      const a = d.life / d.maxLife;
      ctx.globalAlpha = a; ctx.fillStyle = d.color;
      ctx.font = `bold ${d.size}px Orbitron`; ctx.textAlign = 'center';
      ctx.shadowColor = d.color; ctx.shadowBlur = 5;
      ctx.fillText(d.text, d.x, d.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },
  
  loop(t) {
    const dt = Math.min(0.033, (t - this.lastT) / 1000);
    this.lastT = t;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
};